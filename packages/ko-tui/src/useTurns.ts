import { useRef, useEffect, useState } from "react";
import type { AgentSessionEvent } from "@kocode/ko-agent";
import { type Turn, createTurn } from "./types.js";

export interface TurnState {
  completedTurns: Turn[];
  activeTurn: Turn | null;
}

export function useTurns(events: AgentSessionEvent[]): TurnState {
  const turnsRef = useRef<Turn[]>([]);
  const lastIndexRef = useRef(0);
  const [, setVersion] = useState(0);

  useEffect(() => {
    let changed = false;
    for (let i = lastIndexRef.current; i < events.length; i++) {
      processEvent(events[i]!, turnsRef.current);
      changed = true;
    }
    lastIndexRef.current = events.length;
    if (changed) {
      setVersion((v) => v + 1);
    }
  }, [events.length]);

  const allTurns = turnsRef.current;
  const lastTurn = allTurns[allTurns.length - 1];
  const isLastActive = lastTurn && lastTurn.status === "streaming";

  return {
    completedTurns: isLastActive ? allTurns.slice(0, -1) : allTurns,
    activeTurn: isLastActive ? lastTurn : null,
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

export function processEvent(event: AgentSessionEvent, turns: Turn[]): void {
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
        last.assistant.textContent = mergeDelta(
          last.assistant.textContent,
          event.delta,
        );
      }
      break;
    }

    case "tool_start": {
      const last = lastTurn(turns);
      if (last) {
        const existingRunning = findLatestToolCall(
          last.assistant.toolCalls,
          event.toolCallId,
          "running",
        );
        if (existingRunning) {
          existingRunning.name = event.toolName;
          existingRunning.input = event.input;
          break;
        }

        const key = `${last.id}:${last.assistant.toolCalls.length}:${event.toolCallId}`;
        last.assistant.toolCalls.push({
          key,
          id: event.toolCallId,
          name: event.toolName,
          input: event.input,
          status: "running",
        });
      }
      break;
    }

    case "tool_end": {
      const last = lastTurn(turns);
      if (last) {
        const tc = findLatestToolCall(
          last.assistant.toolCalls,
          event.toolCallId,
          "running",
        ) ?? findLatestToolCall(
          last.assistant.toolCalls,
          event.toolCallId,
        );
        if (tc) {
          tc.result = event.result;
          tc.status = event.result.isError ? "error" : "done";
        }
      }
      break;
    }

    case "thinking_delta": {
      const last = lastTurn(turns);
      if (last) {
        const blocks = last.assistant.thinkingBlocks;
        const cur = blocks[blocks.length - 1];
        if (cur) {
          cur.content = mergeDelta(cur.content, event.delta);
        } else {
          blocks.push({ content: event.delta, collapsed: true });
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
      const turn = {
        id: turns.length,
        userMessage: { content: `!${event.command}` },
        assistant: {
          textContent: "",
          thinkingBlocks: [],
          toolCalls: [
            {
              key: `${turns.length}:0:shell`,
              id: "shell",
              name: "bash",
              input: { command: event.command },
              status: "running" as const,
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
      const shell = last?.assistant.toolCalls.find((tc) => tc.id === "shell" && tc.status === "running");
      if (last && shell) {
        const output = event.stdout || event.stderr || "Done";
        shell.status = event.exitCode === 0 ? "done" : "error";
        shell.result = { isError: event.exitCode !== 0, content: output };
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
          assistant: { textContent: "", thinkingBlocks: [], toolCalls: [] },
          status: "error",
          errorMessage: event.errorMessage,
        };
        turns.push(errTurn);
      }
      break;
    }

    case "message_start":
    case "message_end":
    case "thinking_start":
    case "thinking_end":
    case "compaction_start":
    case "compaction_end":
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

function findLatestToolCall(
  toolCalls: Turn["assistant"]["toolCalls"],
  id: string,
  status?: Turn["assistant"]["toolCalls"][number]["status"],
): Turn["assistant"]["toolCalls"][number] | undefined {
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    const toolCall = toolCalls[i]!;
    if (toolCall.id === id && (!status || toolCall.status === status)) {
      return toolCall;
    }
  }
  return undefined;
}
