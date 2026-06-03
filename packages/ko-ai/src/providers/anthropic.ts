import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type {
  CacheControlEphemeral,
  ContentBlock,
  ContentBlockParam,
  MessageParam,
} from "@anthropic-ai/sdk/resources/messages/index.js";

import type {
  ApiType,
  AssistantMessage,
  Context,
  ImageContent,
  Message,
  Model,
  SimpleStreamOptions,
  StreamOptions,
  TextContent,
  ThinkingContent,
  ToolCall,
  ToolResultMessage,
} from "../types.js";
import type { AnthropicMessagesCompat } from "../compat.js";
import { AssistantMessageEventStream } from "../stream.js";
import { getEnvApiKey } from "../env-api-keys.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCompat(model: Model): AnthropicMessagesCompat {
  return (model.compat as AnthropicMessagesCompat) ?? {};
}

function makeStreamAnthropic(
  model: Model,
  context: Context,
  options?: StreamOptions,
): AssistantMessageEventStream {
  const apiKey = options?.apiKey ?? getEnvApiKey(model.provider);
  if (!apiKey) {
    const stream = new AssistantMessageEventStream();
    stream.push({
      type: "error",
      reason: "error",
      error: createError(model, new Error("No API key configured for Anthropic")),
    });
    stream.end();
    return stream;
  }

  const stream_ = new AssistantMessageEventStream();
  runStream(model, context, options!, apiKey, stream_).catch(() => {
    // errors already encoded in stream
  });
  return stream_;
}

function makeStreamSimpleAnthropic(
  model: Model,
  context: Context,
  options?: SimpleStreamOptions,
): AssistantMessageEventStream {
  const simpleContext: Context = { ...context, tools: undefined };
  return makeStreamAnthropic(model, simpleContext, options as StreamOptions);
}

async function runStream(
  model: Model,
  context: Context,
  options: StreamOptions,
  apiKey: string,
  stream: AssistantMessageEventStream,
): Promise<void> {
  const mergedHeaders = { ...(model.headers ?? {}), ...(options.headers ?? {}) };
  const client = new Anthropic({
    apiKey,
    baseURL: model.baseUrl,
    maxRetries: options.maxRetries ?? 2,
    defaultHeaders: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
  });

  try {
    const { messages, systemPrompt } = convertMessages(context);
    const compat = getCompat(model);

    const params: Anthropic.Messages.MessageCreateParamsStreaming = {
      model: model.id,
      max_tokens: options.maxTokens ?? model.maxTokens,
      messages,
      stream: true,
    };

    if (systemPrompt) params.system = systemPrompt;
    if (context.tools?.length) {
      params.tools = context.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: { type: "object" as const, properties: t.parameters.properties ?? {}, ...(t.parameters.required && { required: t.parameters.required }) },
      }));
    }

    // Build a partial for event emissions
    const partial: AssistantMessage = {
      role: "assistant",
      content: [],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
      stopReason: "stop",
      timestamp: Date.now(),
    };

    stream.push({ type: "start", partial });

    let textIndex = 0;
    let thinkingIndex = 0;
    let toolIndex = 0;
    let currentToolCall: Partial<ToolCall> | null = null;
    let toolInputJson = "";

    const response = await client.messages.create(params);
    for await (const event of response) {
      switch (event.type) {
        case "message_start": {
          const msg = event.message;
          partial.usage.input = msg.usage.input_tokens;
          partial.usage.output = msg.usage.output_tokens;
          break;
        }

        case "content_block_start": {
          const block = event.content_block;
          if (isTextBlock(block)) {
            textIndex = partial.content.length;
            partial.content.push({ type: "text", text: "" });
            stream.push({ type: "text_start", contentIndex: textIndex, partial: { ...partial } });
          } else if (isThinkingBlock(block)) {
            thinkingIndex = partial.content.length;
            partial.content.push({ type: "thinking", thinking: "", signature: block.signature, redacted: false });
            stream.push({ type: "thinking_start", contentIndex: thinkingIndex, partial: { ...partial } });
          } else if (isToolUseBlock(block)) {
            toolIndex = partial.content.length;
            currentToolCall = { type: "toolCall", id: block.id, name: block.name, arguments: {} };
            toolInputJson = "";
            partial.content.push(currentToolCall as ToolCall);
            stream.push({ type: "toolcall_start", contentIndex: toolIndex, partial: { ...partial } });
          }
          break;
        }

        case "content_block_delta": {
          const delta = event.delta;
          if (delta.type === "text_delta" && partial.content[textIndex]?.type === "text") {
            (partial.content[textIndex] as TextContent).text += delta.text;
            stream.push({ type: "text_delta", contentIndex: textIndex, delta: delta.text, partial: { ...partial } });
          } else if (delta.type === "thinking_delta" && partial.content[thinkingIndex]?.type === "thinking") {
            (partial.content[thinkingIndex] as ThinkingContent).thinking += delta.thinking;
            stream.push({ type: "thinking_delta", contentIndex: thinkingIndex, delta: delta.thinking, partial: { ...partial } });
          } else if (delta.type === "input_json_delta" && currentToolCall) {
            toolInputJson += delta.partial_json;
            stream.push({ type: "toolcall_delta", contentIndex: toolIndex, delta: delta.partial_json, partial: { ...partial } });
          }
          break;
        }

        case "content_block_stop": {
          const idx = event.index;
          const contentBlock = partial.content[idx];
          if (contentBlock?.type === "text") {
            stream.push({ type: "text_end", contentIndex: textIndex, content: contentBlock.text, partial: { ...partial } });
            textIndex++;
          } else if (contentBlock?.type === "thinking") {
            stream.push({ type: "thinking_end", contentIndex: thinkingIndex, content: contentBlock.thinking, partial: { ...partial } });
            thinkingIndex++;
          } else if (contentBlock?.type === "toolCall" && currentToolCall) {
            try { currentToolCall.arguments = JSON.parse(toolInputJson); } catch { currentToolCall.arguments = {}; }
            stream.push({ type: "toolcall_end", contentIndex: toolIndex, toolCall: currentToolCall as ToolCall, partial: { ...partial } });
            currentToolCall = null;
            toolIndex++;
          }
          break;
        }

        case "message_delta": {
          partial.stopReason = mapStopReason(event.delta.stop_reason);
          partial.usage.output += event.usage.output_tokens;
          break;
        }
      }
    }

    partial.usage.totalTokens = partial.usage.input + partial.usage.output;
    partial.timestamp = Date.now();

    stream.push({ type: "done", reason: "stop", message: partial });
    stream.end();
  } catch (err) {
    const message = createError(model, err);
    stream.push({ type: "error", reason: "error", error: message });
    stream.end(message);
  }
}

// ── Message conversion ──────────────────────────────────────────────────────

function convertMessages(
  context: Context,
): { messages: MessageParam[]; systemPrompt?: string } {
  const messages: MessageParam[] = [];

  for (const msg of context.messages) {
    switch (msg.role) {
      case "user": {
        const param: MessageParam = {
          role: "user",
          content: typeof msg.content === "string"
            ? msg.content
            : msg.content.map(convertContentBlock),
        };
        messages.push(param);
        break;
      }
      case "assistant": {
        const param: MessageParam = {
          role: "assistant",
          content: msg.content.map(convertContentBlock),
        };
        messages.push(param);
        break;
      }
      case "toolResult": {
        const param: MessageParam = {
          role: "user",
          content: [{
            type: "tool_result",
            tool_use_id: msg.toolCallId,
            content: msg.content.filter((c): c is TextContent => c.type === "text")
              .map((c) => c.text)
              .join(""),
            is_error: msg.isError,
          }],
        };
        messages.push(param);
        break;
      }
    }
  }

  return { messages, systemPrompt: context.systemPrompt };
}

function convertContentBlock(
  block: any,
): ContentBlockParam | ContentBlock {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text };
    case "thinking":
      return { type: "thinking", thinking: block.thinking, signature: block.signature ?? "" };
    case "toolCall":
      return {
        type: "tool_use",
        id: block.id,
        name: block.name,
        input: block.arguments,
      };
    default:
      return { type: "text", text: "" };
  }
}

// ── Type guards ─────────────────────────────────────────────────────────────

function isTextBlock(b: any): b is { type: "text"; text: string } {
  return b.type === "text";
}

function isThinkingBlock(b: any): b is { type: "thinking"; thinking: string; signature: string; redacted?: boolean } {
  return b.type === "thinking";
}

function isToolUseBlock(b: any): b is { type: "tool_use"; id: string; name: string; input: any } {
  return b.type === "tool_use";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function mapStopReason(reason: string | null): "stop" | "length" | "toolUse" | "error" {
  switch (reason) {
    case "end_turn": return "stop";
    case "max_tokens": return "length";
    case "tool_use": return "toolUse";
    default: return "stop";
  }
}

function createError(model: Model, err: unknown): AssistantMessage {
  return {
    role: "assistant",
    content: [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
    stopReason: "error",
    errorMessage: err instanceof Error ? err.message : String(err),
    timestamp: Date.now(),
  };
}

// ── Public exports ──────────────────────────────────────────────────────────

export const streamAnthropic = makeStreamAnthropic;
export const streamSimpleAnthropic = makeStreamSimpleAnthropic;
