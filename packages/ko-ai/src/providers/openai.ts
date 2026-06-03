import OpenAI from "openai";

import type {
  AssistantMessage,
  Context,
  Message,
  Model,
  SimpleStreamOptions,
  StreamOptions,
  TextContent,
  ThinkingContent,
  ToolCall,
} from "../types.js";
import type { OpenAICompletionsCompat } from "../compat.js";
import { AssistantMessageEventStream } from "../stream.js";
import { getEnvApiKey } from "../env-api-keys.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCompat(model: Model): OpenAICompletionsCompat {
  return (model.compat as OpenAICompletionsCompat) ?? {};
}

function resolveMaxTokensField(model: Model): "max_completion_tokens" | "max_tokens" {
  return getCompat(model).maxTokensField ?? "max_completion_tokens";
}

function makeStreamOpenAI(
  model: Model,
  context: Context,
  options?: StreamOptions,
): AssistantMessageEventStream {
  const apiKey = options?.apiKey ?? getEnvApiKey(model.provider);
  if (!apiKey) {
    const stream = new AssistantMessageEventStream();
    stream.push({ type: "error", reason: "error", error: createError(model, new Error("No API key configured")) });
    stream.end();
    return stream;
  }

  const stream_ = new AssistantMessageEventStream();
  runStream(model, context, options!, apiKey, stream_).catch(() => {});
  return stream_;
}

function makeStreamSimpleOpenAI(
  model: Model,
  context: Context,
  options?: SimpleStreamOptions,
): AssistantMessageEventStream {
  const simpleContext: Context = { ...context, tools: undefined };
  return makeStreamOpenAI(model, simpleContext, options as StreamOptions);
}

async function runStream(
  model: Model,
  context: Context,
  options: StreamOptions,
  apiKey: string,
  stream: AssistantMessageEventStream,
): Promise<void> {
  const compat = getCompat(model);
  const mergedHeaders = { ...(model.headers ?? {}), ...(options.headers ?? {}) };
  const client = new OpenAI({
    apiKey,
    baseURL: model.baseUrl,
    maxRetries: options.maxRetries ?? 2,
    defaultHeaders: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
  });

  try {
    const messages = convertMessages(context);

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
      model: model.id,
      messages: messages as any,
      stream: true,
      stream_options: compat.supportsUsageInStreaming !== false
        ? { include_usage: true }
        : undefined,
    };

    // max tokens
    const maxField = resolveMaxTokensField(model);
    (params as any)[maxField] = options.maxTokens ?? model.maxTokens;

    // temperature
    if (options.temperature !== undefined) {
      params.temperature = options.temperature;
    }

    // reasoning
    const compat_ = getCompat(model);
    const reasoning = (options as SimpleStreamOptions).reasoning;
    if (reasoning && model.reasoning) {
      const format = compat_.thinkingFormat ?? "openai";
      switch (format) {
        case "openai":
          params.reasoning_effort = reasoning as any;
          break;
        case "openrouter":
          (params as any).reasoning = { effort: reasoning };
          break;
        case "deepseek":
          (params as any).thinking = { type: reasoning === "off" ? "disabled" : "enabled" };
          if (reasoning !== "off" && compat_.supportsReasoningEffort !== false) {
            (params as any).reasoning_effort = reasoning;
          }
          break;
        case "together":
          (params as any).reasoning = { enabled: reasoning !== "off" };
          if (reasoning !== "off") (params as any).reasoning_effort = reasoning;
          break;
      }
    }

    // tools
    if (context.tools?.length) {
      params.tools = context.tools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
          strict: compat.supportsStrictMode !== false ? true : undefined,
        },
      }));
    }

    // system prompt
    if (context.systemPrompt) {
      const systemRole: string = compat.supportsDeveloperRole ? "developer" : "system";
      messages.unshift({ role: systemRole, content: context.systemPrompt });
    }

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
    let currentToolCallId = "";
    let currentToolCallName = "";
    let currentToolCallArgs = "";

    const response = await client.chat.completions.create(params);
    for await (const chunk of response) {
      // usage
      if (chunk.usage) {
        partial.usage.input = chunk.usage.prompt_tokens ?? 0;
        partial.usage.output = chunk.usage.completion_tokens ?? 0;
      }

      if (!chunk.choices?.length) continue;
      const choice = chunk.choices[0]!;

      // finish reason
      if (choice.finish_reason) {
        partial.stopReason = mapStopReason(choice.finish_reason);
      }

      const delta = choice.delta;
      if (!delta) continue;

      // thinking / reasoning
      const reasoningContent = (delta as any).reasoning_content as string | undefined;
      if (reasoningContent) {
        const reqAsText = compat.requiresThinkingAsText;
        if (reqAsText) {
          addTextContent(partial, `\n<thinking>${reasoningContent}</thinking>\n`);
        } else {
          if (!partial.content.some((c) => c.type === "thinking")) {
            const thinking: ThinkingContent = { type: "thinking", thinking: "" };
            partial.content.push(thinking);
            stream.push({ type: "thinking_start", contentIndex: thinkingIndex, partial: { ...partial } });
          }
          const thinkingBlock = partial.content.find((c) => c.type === "thinking") as ThinkingContent;
          if (thinkingBlock) {
            thinkingBlock.thinking += reasoningContent;
            stream.push({ type: "thinking_delta", contentIndex: thinkingIndex, delta: reasoningContent, partial: { ...partial } });
          }
        }
      }

      // text
      if (delta.content) {
        if (!partial.content[textIndex] || partial.content[textIndex].type !== "text") {
          textIndex = partial.content.length;
          partial.content.push({ type: "text", text: "" });
          stream.push({ type: "text_start", contentIndex: textIndex, partial: { ...partial } });
        }
        (partial.content[textIndex] as TextContent).text += delta.content;
        stream.push({ type: "text_delta", contentIndex: textIndex, delta: delta.content, partial: { ...partial } });
      }

      // tool call
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.id) {
            // End previous tool call if any
            if (currentToolCallId && currentToolCallId !== tc.id) {
              finishToolCall();
            }
            if (!currentToolCallId) {
              currentToolCallId = tc.id;
              currentToolCallName = tc.function?.name ?? "";
              currentToolCallArgs = "";
              // push start
              partial.content.push({ type: "toolCall", id: tc.id, name: currentToolCallName, arguments: {} });
              stream.push({ type: "toolcall_start", contentIndex: toolIndex, partial: { ...partial } });
            }
          }
          if (currentToolCallId && tc.function?.arguments) {
            currentToolCallArgs += tc.function.arguments;
            stream.push({ type: "toolcall_delta", contentIndex: toolIndex, delta: tc.function.arguments, partial: { ...partial } });
          }
        }
      }
    }

    // End any pending tool call
    if (currentToolCallId) finishToolCall();

    partial.usage.totalTokens = partial.usage.input + partial.usage.output;
    partial.timestamp = Date.now();

    // End open thinking/text blocks
    const lastText = partial.content.filter((c) => c.type === "text");
    if (lastText.length > 0) {
      stream.push({ type: "text_end", contentIndex: lastText.length - 1, content: (lastText[lastText.length - 1] as TextContent).text, partial: { ...partial } });
    }

    stream.push({ type: "done", reason: "stop", message: partial });
    stream.end();

    function finishToolCall() {
      const toolCall: ToolCall = {
        type: "toolCall",
        id: currentToolCallId,
        name: currentToolCallName,
        arguments: safeJsonParse(currentToolCallArgs),
      };
      const idx = partial.content.findIndex((c) => c.type === "toolCall" && (c as ToolCall).id === currentToolCallId);
      if (idx >= 0) partial.content[idx] = toolCall;
      stream.push({ type: "toolcall_end", contentIndex: toolIndex, toolCall, partial: { ...partial } });
      toolIndex++;
      currentToolCallId = "";
      currentToolCallName = "";
      currentToolCallArgs = "";
    }
  } catch (err) {
    const message = createError(model, err);
    stream.push({ type: "error", reason: "error", error: message });
    stream.end(message);
  }
}

// ── Message conversion ──────────────────────────────────────────────────────

function convertMessages(context: Context): any[] {
  const messages: any[] = [];

  for (const msg of context.messages) {
    switch (msg.role) {
      case "user":
        messages.push({
          role: "user",
          content: typeof msg.content === "string" ? msg.content : msg.content.map(convertBlock),
        });
        break;
      case "assistant": {
        const m: any = { role: "assistant" };
        const content: any[] = [];
        const toolCalls: any[] = [];
        for (const b of msg.content) {
          if (b.type === "toolCall") {
            toolCalls.push({
              id: b.id,
              type: "function",
              function: { name: b.name, arguments: JSON.stringify(b.arguments) },
            });
          } else if (b.type === "text") {
            content.push({ type: "text", text: b.text });
          } else if (b.type === "thinking") {
            content.push({ type: "text", text: `<thinking>${b.thinking}</thinking>` });
          }
        }
        if (content.length) m.content = content;
        if (toolCalls.length) m.tool_calls = toolCalls;
        messages.push(m);
        break;
      }
      case "toolResult": {
        messages.push({
          role: "tool",
          tool_call_id: msg.toolCallId,
          content: msg.content.filter((c) => c.type === "text").map((c) => (c as TextContent).text).join(""),
        });
        break;
      }
    }
  }

  return messages;
}

function convertBlock(block: any): any {
  switch (block.type) {
    case "text": return { type: "text", text: block.text };
    case "image": return { type: "image_url", image_url: { url: `data:${block.mimeType};base64,${block.data}` } };
    default: return { type: "text", text: "" };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function mapStopReason(reason: string): "stop" | "length" | "toolUse" | "error" {
  switch (reason) {
    case "stop": return "stop";
    case "length": return "length";
    case "tool_calls": return "toolUse";
    case "function_call": return "toolUse";
    default: return "stop";
  }
}

function addTextContent(partial: AssistantMessage, text: string): void {
  partial.content.push({ type: "text", text });
}

function safeJsonParse(s: string): Record<string, any> {
  try { return JSON.parse(s); } catch { return {}; }
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

export const streamOpenAICompletions = makeStreamOpenAI;
export const streamSimpleOpenAICompletions = makeStreamSimpleOpenAI;
