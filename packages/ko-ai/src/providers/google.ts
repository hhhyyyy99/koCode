import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "@google/generative-ai";

import type {
  AssistantMessage,
  Context,
  Message,
  Model,
  SimpleStreamOptions,
  StreamOptions,
  TextContent,
  ToolCall,
} from "../types.js";
import { AssistantMessageEventStream } from "../stream.js";
import { getEnvApiKey } from "../env-api-keys.js";

function makeStreamGoogle(
  model: Model,
  context: Context,
  options?: StreamOptions,
): AssistantMessageEventStream {
  const apiKey = options?.apiKey ?? getEnvApiKey(model.provider);
  if (!apiKey) {
    const stream = new AssistantMessageEventStream();
    stream.push({ type: "error", reason: "error", error: createError(model, new Error("No API key configured for Google")) });
    stream.end();
    return stream;
  }

  const stream_ = new AssistantMessageEventStream();
  runStream(model, context, options!, apiKey, stream_).catch(() => {});
  return stream_;
}

function makeStreamSimpleGoogle(
  model: Model,
  context: Context,
  options?: SimpleStreamOptions,
): AssistantMessageEventStream {
  const simpleContext: Context = { ...context, tools: undefined };
  return makeStreamGoogle(model, simpleContext, options as StreamOptions);
}

async function runStream(
  model: Model,
  context: Context,
  options: StreamOptions,
  apiKey: string,
  stream: AssistantMessageEventStream,
): Promise<void> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model: model.id });

  try {
    const contents: Content[] = convertMessages(context);
    const systemInstruction = context.systemPrompt;

    const tools: any[] | undefined = context.tools?.length
      ? [{
          functionDeclarations: context.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        } as any]
      : undefined;

    const chat = genModel.startChat({
      systemInstruction,
      tools: tools as any,
      history: contents.slice(0, -1),
    });

    const lastMsg = contents[contents.length - 1];
    const result = await chat.sendMessageStream(lastMsg!.parts as Part[]);

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
    let toolIndex = 0;
    let thinkingIndex = 0;

    for await (const chunk of result.stream) {
      // text
      const text = chunk.text();
      if (text) {
        if (!partial.content[textIndex] || partial.content[textIndex].type !== "text") {
          partial.content.push({ type: "text", text: "" });
          stream.push({ type: "text_start", contentIndex: textIndex, partial: { ...partial } });
        }
        (partial.content[textIndex] as TextContent).text += text;
        stream.push({ type: "text_delta", contentIndex: textIndex, delta: text, partial: { ...partial } });
      }

      // function calls
      const functionCalls = chunk.functionCalls();
      if (functionCalls) {
        for (const fc of functionCalls) {
          const toolCall: ToolCall = {
            type: "toolCall",
            id: fc.name ?? "unknown",
            name: fc.name ?? "unknown",
            arguments: fc.args ?? {},
          };
          partial.content.push(toolCall);
          stream.push({ type: "toolcall_start", contentIndex: toolIndex, partial: { ...partial } });
          stream.push({ type: "toolcall_end", contentIndex: toolIndex, toolCall, partial: { ...partial } });
          toolIndex++;
        }
      }

      // thinking
      const thoughts = (chunk as any).thoughts;
      if (thoughts) {
        const thinking = typeof thoughts === "string" ? thoughts : JSON.stringify(thoughts);
        if (!partial.content.some((c) => c.type === "thinking")) {
          partial.content.push({ type: "thinking", thinking: "" });
          stream.push({ type: "thinking_start", contentIndex: thinkingIndex, partial: { ...partial } });
        }
        const thinkBlock = partial.content.find((c) => c.type === "thinking");
        if (thinkBlock && thinkBlock.type === "thinking") {
          thinkBlock.thinking += thinking;
          stream.push({ type: "thinking_delta", contentIndex: thinkingIndex, delta: thinking, partial: { ...partial } });
        }
      }
    }

    // finish any open text
    const lastTxt = partial.content[textIndex];
    if (lastTxt?.type === "text") {
      stream.push({ type: "text_end", contentIndex: textIndex, content: lastTxt.text, partial: { ...partial } });
    }

    partial.timestamp = Date.now();

    // usage from response
    const fullResponse = await result.response;
    if (fullResponse.usageMetadata) {
      partial.usage.input = fullResponse.usageMetadata.promptTokenCount;
      partial.usage.output = fullResponse.usageMetadata.candidatesTokenCount;
      partial.usage.totalTokens = fullResponse.usageMetadata.totalTokenCount;
    }

    stream.push({ type: "done", reason: "stop", message: partial });
    stream.end();
  } catch (err) {
    const message = createError(model, err);
    stream.push({ type: "error", reason: "error", error: message });
    stream.end(message);
  }
}

// ── Message conversion ──────────────────────────────────────────────────────

function convertMessages(context: Context): Content[] {
  const contents: Content[] = [];

  for (const msg of context.messages) {
    switch (msg.role) {
      case "user":
        contents.push({
          role: "user",
          parts: typeof msg.content === "string"
            ? [{ text: msg.content }]
            : msg.content.map(convertPart),
        });
        break;
      case "assistant": {
        const parts: Part[] = [];
        for (const b of msg.content) {
          if (b.type === "text") parts.push({ text: b.text });
          else if (b.type === "toolCall") {
            parts.push({
              functionCall: {
                name: b.name,
                args: b.arguments,
              },
            });
          }
        }
        contents.push({ role: "model", parts: parts.length ? parts : [{ text: "" }] });
        break;
      }
      case "toolResult": {
        const textContent = msg.content
          .filter((c) => c.type === "text")
          .map((c) => (c as TextContent).text)
          .join("");
        contents.push({
          role: "function",
          parts: [{
            functionResponse: {
              name: msg.toolName,
              response: { result: textContent },
            },
          }],
        });
        break;
      }
    }
  }

  return contents;
}

function convertPart(block: any): Part {
  switch (block.type) {
    case "text": return { text: block.text };
    case "image": return { inlineData: { mimeType: block.mimeType, data: block.data } };
    default: return { text: "" };
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

export const streamGoogle = makeStreamGoogle;
export const streamSimpleGoogle = makeStreamSimpleGoogle;
