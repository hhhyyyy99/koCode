import { useRef, useEffect, useState } from "react";
import type { AgentSessionEvent } from "@kocode/ko-agent";
import {
  type SystemNotice,
  type ToolCallState,
  type Turn,
  createTurn,
  turnToolCalls,
} from "./types.js";

export interface TurnState {
  completedTurns: Turn[];
  activeTurn: Turn | null;
  /** Standalone notices not yet attached to a turn (rare: compaction before any turn). */
  pendingNotices: SystemNotice[];
}

export function useTurns(events: AgentSessionEvent[]): TurnState {
  const turnsRef = useRef<Turn[]>([]);
  const pendingNoticesRef = useRef<SystemNotice[]>([]);
  const eventsRef = useRef(events);
  const lastIndexRef = useRef(0);
  const [, setVersion] = useState(0);

  useEffect(() => {
    let changed = false;
    const replacedEvents =
      events !== eventsRef.current && events.length <= lastIndexRef.current;
    if (replacedEvents) {
      turnsRef.current = [];
      pendingNoticesRef.current = [];
      lastIndexRef.current = 0;
      changed = true;
    }
    eventsRef.current = events;

    for (let i = lastIndexRef.current; i < events.length; i++) {
      processEvent(events[i]!, turnsRef.current, pendingNoticesRef.current);
      changed = true;
    }
    lastIndexRef.current = events.length;
    if (changed) {
      setVersion((v) => v + 1);
    }
  }, [events]);

  const allTurns = turnsRef.current;
  const last = allTurns[allTurns.length - 1];
  const isLastActive = last && last.status === "streaming";

  return {
    completedTurns: isLastActive ? allTurns.slice(0, -1) : allTurns,
    activeTurn: isLastActive ? last : null,
    pendingNotices: pendingNoticesRef.current,
  };
}

// Append delta to existing text, removing any overlapping prefix.
// Handles both incremental deltas and full-accumulated-text providers.
export function mergeDelta(cur: string, delta: string): string {
  if (!cur) return delta;
  if (!delta) return cur;
  const minLen = Math.min(cur.length, delta.length);
  for (let j = minLen; j > 0; j--) {
    if (cur.endsWith(delta.slice(0, j))) {
      return cur + delta.slice(j);
    }
  }
  return cur + delta;
}

function nextAssistantItemKey(turn: Turn, kind: "text" | "thinking"): string {
  return `${turn.id}:${turn.assistant.items.length}:${kind}`;
}

export function formatCompactionSummary(
  reason: "manual" | "threshold" | "overflow",
  result?: { inputTokensBefore: number; inputTokensAfter: number; messagesBefore: number; messagesAfter: number },
): string {
  const reasonLabel =
    reason === "manual" ? "manual" : reason === "threshold" ? "threshold" : "overflow";
  if (result) {
    return `Context compacted (${reasonLabel}): ${result.messagesBefore}→${result.messagesAfter} msgs, ~${result.inputTokensBefore}→${result.inputTokensAfter} tokens`;
  }
  return `Context compacted (${reasonLabel})`;
}

export function processEvent(
  event: AgentSessionEvent,
  turns: Turn[],
  pendingNotices: SystemNotice[] = [],
): void {
  switch (event.type) {
    case "user_message": {
      const turn = createTurn(turns.length, event);
      turns.push(turn);
      break;
    }

    case "turn_start": {
      const last = lastTurn(turns);
      if (last) {
        last.startedAt = Date.now();
      }
      break;
    }

    case "message_delta": {
      const last = lastTurn(turns);
      if (last) {
        const cur = last.assistant.items[last.assistant.items.length - 1];
        if (cur?.type === "text") {
          cur.content = mergeDelta(cur.content, event.delta);
        } else {
          last.assistant.items.push({
            type: "text",
            key: nextAssistantItemKey(last, "text"),
            content: event.delta,
          });
        }
      }
      break;
    }

    case "tool_start": {
      const last = lastTurn(turns);
      if (last) {
        const existingRunning = findLatestToolItem(
          last.assistant.items,
          event.toolCallId,
          "running",
        );
        if (existingRunning) {
          existingRunning.toolCall.name = event.toolName;
          existingRunning.toolCall.input = event.input;
          break;
        }

        const toolOrdinal = turnToolCalls(last).length;
        const key = `${last.id}:${toolOrdinal}:${event.toolCallId}`;
        const toolCall: ToolCallState = {
          key,
          id: event.toolCallId,
          name: event.toolName,
          input: event.input,
          status: "running",
        };
        last.assistant.items.push({
          type: "tool",
          key,
          toolCall,
        });
      }
      break;
    }

    case "tool_end": {
      const last = lastTurn(turns);
      if (last) {
        const tc = findLatestToolItem(
          last.assistant.items,
          event.toolCallId,
          "running",
        ) ?? findLatestToolItem(
          last.assistant.items,
          event.toolCallId,
        );
        if (tc) {
          tc.toolCall.result = event.result;
          tc.toolCall.status = event.result.isError ? "error" : "done";
        }
      }
      break;
    }

    case "thinking_delta": {
      const last = lastTurn(turns);
      if (last) {
        const cur = last.assistant.items[last.assistant.items.length - 1];
        if (cur?.type === "thinking") {
          cur.content = mergeDelta(cur.content, event.delta);
        } else {
          last.assistant.items.push({
            type: "thinking",
            key: nextAssistantItemKey(last, "thinking"),
            content: event.delta,
            collapsed: true,
          });
        }
      }
      break;
    }

    case "turn_end": {
      const last = lastTurn(turns);
      if (last) {
        last.status = "complete";
        last.completedAt = Date.now();
      }
      break;
    }

    case "turn_cancelled": {
      const last = lastTurn(turns);
      if (last) {
        last.status = "complete";
        last.errorMessage = "Turn cancelled";
      }
      break;
    }

    case "shell_start": {
      const key = `${turns.length}:0:shell`;
      const turn = {
        id: turns.length,
        userMessage: { content: `!${event.command}` },
        assistant: {
          items: [
            {
              type: "tool" as const,
              key,
              toolCall: {
                key,
                id: "shell",
                name: "bash",
                input: { command: event.command },
                status: "running" as const,
              },
            },
          ],
        },
        status: "streaming" as const,
        startedAt: Date.now(),
      };
      turns.push(turn);
      break;
    }

    case "shell_end": {
      const last = lastTurn(turns);
      const shell = last ? findLatestToolItem(last.assistant.items, "shell", "running") : undefined;
      if (last && shell) {
        const output = event.stdout || event.stderr || "Done";
        shell.toolCall.status = event.exitCode === 0 ? "done" : "error";
        shell.toolCall.result = { isError: event.exitCode !== 0, content: output };
        last.status = event.exitCode === 0 ? "complete" : "error";
        last.completedAt = Date.now();
        if (event.exitCode !== 0) last.errorMessage = `Shell exited with code ${event.exitCode}`;
      }
      break;
    }

    case "agent_error": {
      const last = lastTurn(turns);
      if (last) {
        last.status = "error";
        last.errorMessage = event.errorMessage;
      } else {
        const errTurn: Turn = {
          id: turns.length,
          userMessage: { content: "(error)" },
          assistant: { items: [] },
          status: "error",
          errorMessage: event.errorMessage,
        };
        turns.push(errTurn);
      }
      break;
    }

    case "compaction_end": {
      const notice: SystemNotice = {
        key: `compaction:${turns.length}:${pendingNotices.length}:${event.reason}`,
        kind: "compaction",
        reason: event.reason,
        summary: formatCompactionSummary(event.reason, event.result),
      };
      const last = lastTurn(turns);
      if (last) {
        last.notices = [...(last.notices ?? []), notice];
      } else {
        pendingNotices.push(notice);
      }
      break;
    }

    case "message_start":
    case "message_end":
    case "thinking_start":
    case "thinking_end":
    case "compaction_start":
    case "model_changed":
    case "thinking_level_changed":
    case "permission_mode_changed":
    case "permission_request":
    case "permission_response":
    case "memory_saved":
      break;
  }
}

function lastTurn(turns: Turn[]): Turn | undefined {
  return turns[turns.length - 1];
}

function findLatestToolItem(
  items: Turn["assistant"]["items"],
  id: string,
  status?: ToolCallState["status"],
): Extract<Turn["assistant"]["items"][number], { type: "tool" }> | undefined {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]!;
    if (item.type !== "tool") continue;
    if (item.toolCall.id === id && (!status || item.toolCall.status === status)) {
      return item;
    }
  }
  return undefined;
}
