import { describe, it, expect } from "vitest";
import { processEvent, mergeDelta } from "../useTurns.js";
import { turnExpandableBlockKeys, turnExpandableBlocks, turnTextContent, turnThinkingBlocks, turnToolCalls, type Turn } from "../types.js";
import type { AgentSessionEvent } from "@kocode/ko-agent";

function makeEvent(overrides: Partial<AgentSessionEvent> & { type: AgentSessionEvent["type"] }): AgentSessionEvent {
  return overrides as AgentSessionEvent;
}

describe("processEvent (full turn lifecycle)", () => {
  it("builds a complete turn from events (incremental provider)", () => {
    const turns: Turn[] = [];

    // User sends message
    processEvent(
      makeEvent({ type: "user_message", content: "你好" }),
      turns,
    );
    expect(turns).toHaveLength(1);
    expect(turns[0]!.userMessage.content).toBe("你好");
    expect(turns[0]!.status).toBe("streaming");

    // Thinking deltas (incremental)
    processEvent(
      makeEvent({ type: "thinking_delta", delta: "The user" }),
      turns,
    );
    processEvent(
      makeEvent({ type: "thinking_delta", delta: " said hello" }),
      turns,
    );
    expect(turnThinkingBlocks(turns[0]!)).toHaveLength(1);
    expect(turnThinkingBlocks(turns[0]!)[0]!.content).toBe(
      "The user said hello",
    );

    // Text deltas (incremental)
    processEvent(
      makeEvent({ type: "message_delta", delta: "你好" }),
      turns,
    );
    processEvent(
      makeEvent({ type: "message_delta", delta: "！有什么" }),
      turns,
    );
    processEvent(
      makeEvent({ type: "message_delta", delta: "可以帮你的吗？" }),
      turns,
    );
    expect(turnTextContent(turns[0]!)).toBe(
      "你好！有什么可以帮你的吗？",
    );

    // Turn ends
    processEvent(makeEvent({ type: "turn_end" }), turns);
    expect(turns[0]!.status).toBe("complete");
  });

  it("builds a complete turn from events (full-text provider like mimo)", () => {
    const turns: Turn[] = [];

    processEvent(
      makeEvent({ type: "user_message", content: "你好" }),
      turns,
    );

    // Full accumulated text each time
    processEvent(
      makeEvent({ type: "thinking_delta", delta: "The user said 你好" }),
      turns,
    );
    processEvent(
      makeEvent({ type: "thinking_delta", delta: "The user said 你好 which means Hello" }),
      turns,
    );
    processEvent(
      makeEvent({
        type: "thinking_delta",
        delta: "The user said 你好 which means Hello. I should respond in Chinese.",
      }),
      turns,
    );
    // Should not duplicate — only the last full text is kept
    expect(turnThinkingBlocks(turns[0]!)[0]!.content).toBe(
      "The user said 你好 which means Hello. I should respond in Chinese.",
    );

    // Full accumulated text
    processEvent(makeEvent({ type: "message_delta", delta: "你好" }), turns);
    processEvent(makeEvent({ type: "message_delta", delta: "你好！" }), turns);
    processEvent(
      makeEvent({ type: "message_delta", delta: "你好！有什么可以帮你的吗？" }),
      turns,
    );
    // Should not duplicate
    expect(turnTextContent(turns[0]!)).toBe(
      "你好！有什么可以帮你的吗？",
    );

    processEvent(makeEvent({ type: "turn_end" }), turns);
    expect(turns[0]!.status).toBe("complete");
  });

  it("handles multiple turns correctly", () => {
    const turns: Turn[] = [];

    // Turn 1
    processEvent(makeEvent({ type: "user_message", content: "hello" }), turns);
    processEvent(makeEvent({ type: "message_delta", delta: "Hi!" }), turns);
    processEvent(makeEvent({ type: "turn_end" }), turns);
    expect(turns).toHaveLength(1);
    expect(turns[0]!.status).toBe("complete");

    // Turn 2
    processEvent(makeEvent({ type: "user_message", content: "bye" }), turns);
    expect(turns).toHaveLength(2);
    expect(turns[1]!.status).toBe("streaming");
    expect(turns[0]!.status).toBe("complete");
    processEvent(makeEvent({ type: "message_delta", delta: "Bye!" }), turns);
    processEvent(makeEvent({ type: "turn_end" }), turns);
    expect(turns[1]!.status).toBe("complete");
    expect(turnTextContent(turns[1]!)).toBe("Bye!");
  });

  it("handles tool calls within a turn", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "user_message", content: "read file" }), turns);
    processEvent(
      makeEvent({
        type: "tool_start",
        toolCallId: "tc1",
        toolName: "read",
        input: { file_path: "/tmp/test.txt" },
      }),
      turns,
    );
    expect(turnToolCalls(turns[0]!)).toHaveLength(1);
    expect(turnToolCalls(turns[0]!)[0]!.status).toBe("running");

    processEvent(
      makeEvent({
        type: "tool_end",
        toolCallId: "tc1",
        toolName: "read",
        result: { isError: false, content: "hello world" },
      }),
      turns,
    );
    expect(turnToolCalls(turns[0]!)[0]!.status).toBe("done");
    expect(turnToolCalls(turns[0]!)[0]!.result?.content).toBe(
      "hello world",
    );

    processEvent(makeEvent({ type: "turn_end" }), turns);
    expect(turns[0]!.status).toBe("complete");
  });

  it("preserves text-tool-text chronology within a turn", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "user_message", content: "inspect config" }), turns);
    processEvent(makeEvent({ type: "message_delta", delta: "I'll inspect the files." }), turns);
    processEvent(
      makeEvent({
        type: "tool_start",
        toolCallId: "tool-call_0",
        toolName: "ls",
        input: { path: ".claude" },
      }),
      turns,
    );
    processEvent(
      makeEvent({
        type: "tool_end",
        toolCallId: "tool-call_0",
        toolName: "ls",
        result: { isError: false, content: "settings.json" },
      }),
      turns,
    );
    processEvent(makeEvent({ type: "message_delta", delta: "The settings are project-local." }), turns);

    expect(turns[0]!.assistant.items.map((item) => item.type)).toEqual([
      "text",
      "tool",
      "text",
    ]);
    expect(turns[0]!.assistant.items[0]).toMatchObject({
      type: "text",
      content: "I'll inspect the files.",
    });
    expect(turns[0]!.assistant.items[1]).toMatchObject({
      type: "tool",
      toolCall: { key: "0:0:tool-call_0", status: "done" },
    });
    expect(turns[0]!.assistant.items[2]).toMatchObject({
      type: "text",
      content: "The settings are project-local.",
    });
  });

  it("derives expandable thinking and tool block keys in visual order", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "user_message", content: "inspect mixed output" }), turns);
    processEvent(makeEvent({ type: "message_delta", delta: "Text before thinking." }), turns);
    processEvent(makeEvent({ type: "thinking_delta", delta: "First thought" }), turns);
    processEvent(makeEvent({ type: "message_delta", delta: "Text before tool." }), turns);
    processEvent(
      makeEvent({
        type: "tool_start",
        toolCallId: "tool-call_0",
        toolName: "read",
        input: { file_path: "package.json" },
      }),
      turns,
    );
    processEvent(
      makeEvent({
        type: "tool_end",
        toolCallId: "tool-call_0",
        toolName: "read",
        result: { isError: false, content: "{}" },
      }),
      turns,
    );
    processEvent(makeEvent({ type: "thinking_delta", delta: "Second thought" }), turns);
    processEvent(makeEvent({ type: "message_delta", delta: "Done." }), turns);

    expect(turns[0]!.assistant.items.map((item) => item.type)).toEqual([
      "text",
      "thinking",
      "text",
      "tool",
      "thinking",
      "text",
    ]);
    expect(turnExpandableBlockKeys(turns[0]!)).toEqual([
      "0:1:thinking",
      "0:0:tool-call_0",
      "0:4:thinking",
    ]);
    expect(turnExpandableBlocks(turns[0]!)).toEqual([
      { key: "0:1:thinking", itemKey: "0:1:thinking", kind: "thinking" },
      { key: "0:0:tool-call_0", itemKey: "0:0:tool-call_0", kind: "tool" },
      { key: "0:4:thinking", itemKey: "0:4:thinking", kind: "thinking" },
    ]);
  });

  it("deduplicates repeated tool_start events for a running tool call", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "user_message", content: "list files" }), turns);
    processEvent(
      makeEvent({
        type: "tool_start",
        toolCallId: "tool-call_0",
        toolName: "ls",
        input: { path: "." },
      }),
      turns,
    );
    processEvent(
      makeEvent({
        type: "tool_start",
        toolCallId: "tool-call_0",
        toolName: "ls",
        input: { path: "." },
      }),
      turns,
    );

    expect(turnToolCalls(turns[0]!)).toHaveLength(1);
    expect(turnToolCalls(turns[0]!)[0]!.key).toBe("0:0:tool-call_0");
    expect(turns[0]!.assistant.items).toHaveLength(1);
    expect(turns[0]!.assistant.items[0]).toMatchObject({
      type: "tool",
      toolCall: { key: "0:0:tool-call_0" },
    });

    processEvent(
      makeEvent({
        type: "tool_end",
        toolCallId: "tool-call_0",
        toolName: "ls",
        result: { isError: false, content: "package.json" },
      }),
      turns,
    );

    expect(turnToolCalls(turns[0]!)).toHaveLength(1);
    expect(turnToolCalls(turns[0]!)[0]!.status).toBe("done");
    expect(turnToolCalls(turns[0]!)[0]!.result?.content).toBe("package.json");
  });

  it("keeps unique TUI keys when a provider reuses a completed tool id", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "user_message", content: "inspect project" }), turns);
    processEvent(
      makeEvent({
        type: "tool_start",
        toolCallId: "tool-call_0",
        toolName: "ls",
        input: { path: "." },
      }),
      turns,
    );
    processEvent(
      makeEvent({
        type: "tool_end",
        toolCallId: "tool-call_0",
        toolName: "ls",
        result: { isError: false, content: "package.json" },
      }),
      turns,
    );
    processEvent(
      makeEvent({
        type: "tool_start",
        toolCallId: "tool-call_0",
        toolName: "bash",
        input: { command: "pwd" },
      }),
      turns,
    );

    expect(turnToolCalls(turns[0]!)).toHaveLength(2);
    expect(turns[0]!.assistant.items.map((item) => item.type)).toEqual(["tool", "tool"]);
    expect(turnToolCalls(turns[0]!).map((tc) => tc.key)).toEqual([
      "0:0:tool-call_0",
      "0:1:tool-call_0",
    ]);
    expect(turnToolCalls(turns[0]!)[1]!.status).toBe("running");

    processEvent(
      makeEvent({
        type: "tool_end",
        toolCallId: "tool-call_0",
        toolName: "bash",
        result: { isError: false, content: "/workspace" },
      }),
      turns,
    );

    expect(turnToolCalls(turns[0]!)[0]!.result?.content).toBe("package.json");
    expect(turnToolCalls(turns[0]!)[1]!.result?.content).toBe("/workspace");
  });

  it("renders shell prefix events as a local bash tool turn", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "shell_start", command: "pwd" }), turns);

    expect(turns).toHaveLength(1);
    expect(turns[0]!.userMessage.content).toBe("!pwd");
    expect(turnToolCalls(turns[0]!)[0]).toMatchObject({
      id: "shell",
      name: "bash",
      input: { command: "pwd" },
      status: "running",
    });

    processEvent(
      makeEvent({ type: "shell_end", exitCode: 0, stdout: "/workspace", stderr: "" }),
      turns,
    );

    expect(turns[0]!.status).toBe("complete");
    expect(turnToolCalls(turns[0]!)[0]!.status).toBe("done");
    expect(turnToolCalls(turns[0]!)[0]!.result?.content).toBe("/workspace");
    expect(turns[0]!.completedAt).toBeTypeOf("number");
  });
  it("handles agent error with active turn", () => {
    const turns: Turn[] = [];
    processEvent(makeEvent({ type: "user_message", content: "test" }), turns);
    processEvent(
      makeEvent({ type: "agent_error", errorMessage: "API error", willRetry: false }),
      turns,
    );
    expect(turns[0]!.status).toBe("error");
    expect(turns[0]!.errorMessage).toBe("API error");
  });

  it("handles agent error without active turn", () => {
    const turns: Turn[] = [];
    processEvent(
      makeEvent({ type: "agent_error", errorMessage: "fatal", willRetry: false }),
      turns,
    );
    expect(turns).toHaveLength(1);
    expect(turns[0]!.status).toBe("error");
  });

  it("attaches compaction notice to the last turn from existing events", () => {
    const turns: Turn[] = [];
    processEvent(makeEvent({ type: "user_message", content: "hello" }), turns);
    processEvent(makeEvent({ type: "message_delta", delta: "Hi" }), turns);
    processEvent(makeEvent({ type: "turn_end" }), turns);
    processEvent(
      makeEvent({
        type: "compaction_end",
        reason: "manual",
        result: {
          inputTokensBefore: 1000,
          inputTokensAfter: 400,
          messagesBefore: 20,
          messagesAfter: 5,
        },
      }),
      turns,
    );
    expect(turns[0]!.notices?.length).toBe(1);
    expect(turns[0]!.notices?.[0]?.kind).toBe("compaction");
    expect(turns[0]!.notices?.[0]?.summary).toContain("compacted");
    expect(turns[0]!.notices?.[0]?.summary).toContain("20→5");
  });

  it("keeps pending compaction notice when no turn exists yet", () => {
    const turns: Turn[] = [];
    const pending: import("../types.js").SystemNotice[] = [];
    processEvent(
      makeEvent({ type: "compaction_end", reason: "threshold" }),
      turns,
      pending,
    );
    expect(turns).toHaveLength(0);
    expect(pending).toHaveLength(1);
    expect(pending[0]!.summary).toContain("threshold");
  });
});
