import type { AgentSessionEvent } from "@kocode/ko-agent";

export interface ToolCallState {
  key: string;
  id: string;
  name: string;
  input: Record<string, any>;
  result?: { isError: boolean; content: string };
  status: "running" | "done" | "error";
}

export interface Turn {
  id: number;
  userMessage: { content: string; images?: { data: string; mimeType: string }[] };
  assistant: {
    textContent: string;
    thinkingBlocks: { content: string; collapsed: boolean }[];
    toolCalls: ToolCallState[];
  };
  status: "streaming" | "complete" | "error";
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

export function createTurn(id: number, event: AgentSessionEvent & { type: "user_message" }): Turn {
  return {
    id,
    userMessage: { content: event.content, images: event.images },
    assistant: {
      textContent: "",
      thinkingBlocks: [],
      toolCalls: [],
    },
    status: "streaming",
  };
}
