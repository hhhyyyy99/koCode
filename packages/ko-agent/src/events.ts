// ============================================================================
// AgentSessionEvent — events emitted from the agent to the TUI/CLI
// ============================================================================

import type { AssistantMessage, Message, Model, Usage } from "@kocode/ko-ai";
import type { ToolCall } from "@kocode/ko-ai";
import type { PermissionRequestToolType } from "./tool-permissions.js";

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high";

export interface CompactionResult {
  inputTokensBefore: number;
  inputTokensAfter: number;
  messagesBefore: number;
  messagesAfter: number;
}

export type AgentSessionEvent =
  // User input
  | { type: "user_message"; content: string; images?: { data: string; mimeType: string }[] }

  // Turn lifecycle
  | { type: "turn_start" }
  | { type: "turn_end"; usage: Usage; stopReason: string }
  | { type: "turn_cancelled" }

  // Message streaming
  | { type: "message_start"; index: number; partial: AssistantMessage }
  | { type: "message_delta"; index: number; delta: string; partial: AssistantMessage }
  | { type: "message_end"; index: number; message: AssistantMessage }

  // Thinking
  | { type: "thinking_start"; index: number; partial: AssistantMessage }
  | { type: "thinking_delta"; index: number; delta: string; partial: AssistantMessage }
  | { type: "thinking_end"; index: number; content: string; partial: AssistantMessage }

  // Tool execution
  | { type: "tool_start"; toolCallId: string; toolName: string; input: Record<string, any> }
  | { type: "tool_end"; toolCallId: string; toolName: string; result: { isError: boolean; content: string } }

  // Compaction
  | { type: "compaction_start"; reason: "manual" | "threshold" | "overflow" }
  | { type: "compaction_end"; reason: "manual" | "threshold" | "overflow"; result?: CompactionResult }

  // Configuration changes
  | { type: "model_changed"; model: Model }
  | { type: "thinking_level_changed"; level: ThinkingLevel }

  // Shell execution (from ! prefix)
  | { type: "shell_start"; command: string }
  | { type: "shell_end"; exitCode: number; stdout: string; stderr: string }

  // Permission system
  | { type: "permission_request"; requestId: string; toolType: PermissionRequestToolType; toolName: string; params: Record<string, any>; description: string }
  | { type: "permission_response"; requestId: string; action: "approve" | "deny" | "approve_all" }

  // Memory (from # prefix)
  | { type: "memory_saved"; content: string; file: string }

  // Permission mode change
  | { type: "permission_mode_changed"; mode: PermissionMode }

  // Session restore
  | { type: "session_resumed"; sessionId: string; messages: Message[] }

  // Errors
  | { type: "agent_error"; errorMessage: string; willRetry: boolean };

export type AgentSessionEventListener = (event: AgentSessionEvent) => void;

export type PermissionMode = "default" | "accept_edits" | "auto";
