import type { AgentSessionEvent } from "@kocode/ko-agent";

export interface ToolCallState {
  key: string;
  id: string;
  name: string;
  input: Record<string, any>;
  result?: { isError: boolean; content: string };
  status: "running" | "done" | "error";
}

export interface TextAssistantItem {
  type: "text";
  key: string;
  content: string;
}

export interface ThinkingAssistantItem {
  type: "thinking";
  key: string;
  content: string;
  collapsed: boolean;
}

export interface ToolAssistantItem {
  type: "tool";
  key: string;
  toolCall: ToolCallState;
}

export type AssistantItem = TextAssistantItem | ThinkingAssistantItem | ToolAssistantItem;

export type ExpandableTranscriptBlockKind = "thinking" | "tool";

export interface ExpandableTranscriptBlock {
  key: string;
  itemKey: string;
  kind: ExpandableTranscriptBlockKind;
}

export interface Turn {
  id: number;
  userMessage: { content: string; images?: { data: string; mimeType: string }[] };
  assistant: {
    items: AssistantItem[];
  };
  status: "streaming" | "complete" | "error";
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

export function turnTextContent(turn: Turn): string {
  return turn.assistant.items
    .filter((item): item is TextAssistantItem => item.type === "text")
    .map((item) => item.content)
    .join("");
}

export function turnThinkingBlocks(turn: Turn): ThinkingAssistantItem[] {
  return turn.assistant.items.filter((item): item is ThinkingAssistantItem => item.type === "thinking");
}

export function turnToolCalls(turn: Turn): ToolCallState[] {
  return turn.assistant.items
    .filter((item): item is ToolAssistantItem => item.type === "tool")
    .map((item) => item.toolCall);
}

export function turnExpandableBlocks(turn: Turn): ExpandableTranscriptBlock[] {
  return turn.assistant.items.flatMap((item): ExpandableTranscriptBlock[] => {
    if (item.type === "thinking") {
      return [{ key: item.key, itemKey: item.key, kind: "thinking" }];
    }
    if (item.type === "tool") {
      return [{ key: item.toolCall.key, itemKey: item.key, kind: "tool" }];
    }
    return [];
  });
}

export function turnExpandableBlockKeys(turn: Turn): string[] {
  return turnExpandableBlocks(turn).map((block) => block.key);
}

export function createTurn(id: number, event: AgentSessionEvent & { type: "user_message" }): Turn {
  return {
    id,
    userMessage: { content: event.content, images: event.images },
    assistant: {
      items: [],
    },
    status: "streaming",
  };
}
