import { describe, expect, it, vi } from "vitest";
import type { AssistantMessage, AssistantMessageEvent, Model } from "@kocode/ko-ai";

const streamMock = vi.fn();

vi.mock("@kocode/ko-ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@kocode/ko-ai")>();
  return {
    ...actual,
    stream: streamMock,
  };
});

const { AgentSession } = await import("../agent-session.js");

const mockModel: Model = {
  id: "claude-sonnet-4-5-20250514",
  name: "Test",
  api: "anthropic-messages" as any,
  provider: "anthropic",
  baseUrl: "https://api.anthropic.com",
  reasoning: true,
  input: ["text"],
  cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  contextWindow: 200000,
  maxTokens: 8192,
};

const usage = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

function assistantMessage(content: AssistantMessage["content"] = []): AssistantMessage {
  return {
    role: "assistant",
    content,
    api: mockModel.api,
    provider: mockModel.provider,
    model: mockModel.id,
    usage,
    stopReason: "toolUse",
    timestamp: Date.now(),
  };
}

async function* events(items: AssistantMessageEvent[]) {
  for (const item of items) yield item;
}

describe("AgentSession tool call collection", () => {
  it("deduplicates repeated toolcall_end events before executing tools", async () => {
    const execute = vi.fn(async () => ({ isError: false, content: "ok" }));
    const tool = {
      name: "ls",
      description: "List files",
      parameters: { type: "object", properties: {} },
      execute,
    };
    const firstPartial = assistantMessage([
      { type: "toolCall", id: "tool-call_0", name: "ls", arguments: { path: "/stale" } },
    ]);
    const secondPartial = assistantMessage([
      { type: "toolCall", id: "tool-call_0", name: "ls", arguments: { path: "." } },
    ]);
    const done = assistantMessage(secondPartial.content);

    streamMock.mockReturnValueOnce(events([
      { type: "start", partial: assistantMessage() },
      {
        type: "toolcall_end",
        contentIndex: 0,
        toolCall: { type: "toolCall", id: "tool-call_0", name: "ls", arguments: { path: "/stale" } },
        partial: firstPartial,
      },
      {
        type: "toolcall_end",
        contentIndex: 0,
        toolCall: { type: "toolCall", id: "tool-call_0", name: "ls", arguments: { path: "." } },
        partial: secondPartial,
      },
      { type: "done", reason: "toolUse", message: done },
    ]));

    const session = new AgentSession({ model: mockModel, cwd: "/tmp", tools: [tool], maxLoopCount: 1 });
    const emitted: string[] = [];
    session.addEventListener((event) => emitted.push(event.type));

    await session.prompt("list files");

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({ path: "." }, "/tmp");
    const assistant = session.getMessages().find((msg) => msg.role === "assistant");
    expect(assistant?.content).toEqual([
      { type: "toolCall", id: "tool-call_0", name: "ls", arguments: { path: "." } },
    ]);
    expect(emitted.filter((type) => type === "tool_start")).toHaveLength(1);
    expect(emitted.filter((type) => type === "tool_end")).toHaveLength(1);
  });

  it("reuses same-signature tool results across loop iterations without a second permission request", async () => {
    const execute = vi.fn(async () => ({ isError: false, content: "wrote" }));
    const tool = {
      name: "write",
      description: "Write file",
      parameters: { type: "object", properties: {} },
      execute,
    };
    const firstTool = { type: "toolCall" as const, id: "tool-call_0", name: "write", arguments: { file_path: "tmp.txt", content: "alpha\nbeta\n" } };
    const secondTool = { type: "toolCall" as const, id: "tool-call_1", name: "write", arguments: { content: "alpha\nbeta\n", file_path: "tmp.txt" } };

    streamMock
      .mockReturnValueOnce(events([
        { type: "start", partial: assistantMessage() },
        { type: "toolcall_end", contentIndex: 0, toolCall: firstTool, partial: assistantMessage([firstTool]) },
        { type: "done", reason: "toolUse", message: assistantMessage([firstTool]) },
      ]))
      .mockReturnValueOnce(events([
        { type: "start", partial: assistantMessage() },
        { type: "toolcall_end", contentIndex: 0, toolCall: secondTool, partial: assistantMessage([secondTool]) },
        { type: "done", reason: "toolUse", message: assistantMessage([secondTool]) },
      ]))
      .mockReturnValueOnce(events([
        { type: "start", partial: assistantMessage() },
        { type: "text_delta", delta: "done", partial: assistantMessage([{ type: "text", text: "done" }]) },
        { type: "done", reason: "stop", message: { ...assistantMessage([{ type: "text", text: "done" }]), stopReason: "stop" } },
      ]));

    const session = new AgentSession({ model: mockModel, cwd: "/tmp", tools: [tool], maxLoopCount: 3 });
    session.setPermissionMode("auto");
    const emitted: string[] = [];
    session.addEventListener((event) => emitted.push(event.type));

    await session.prompt("write file");

    expect(execute).toHaveBeenCalledTimes(1);
    expect(emitted.filter((type) => type === "tool_start")).toHaveLength(1);
    expect(emitted.filter((type) => type === "tool_end")).toHaveLength(1);
    const toolResults = session.getMessages().filter((msg) => msg.role === "toolResult");
    expect(toolResults).toHaveLength(2);
    expect(toolResults.map((msg) => msg.toolCallId)).toEqual(["tool-call_0", "tool-call_1"]);
  });


  it("records denied permission as a tool result for the next model loop", async () => {
    const execute = vi.fn(async () => ({ isError: false, content: "should not run" }));
    const tool = {
      name: "write",
      description: "Write file",
      parameters: { type: "object", properties: {} },
      execute,
    };
    const toolCall = { type: "toolCall" as const, id: "tool-call_denied", name: "write", arguments: { file_path: "tmp.txt", content: "alpha" } };

    streamMock
      .mockReturnValueOnce(events([
        { type: "start", partial: assistantMessage() },
        { type: "toolcall_end", contentIndex: 0, toolCall, partial: assistantMessage([toolCall]) },
        { type: "done", reason: "toolUse", message: assistantMessage([toolCall]) },
      ]))
      .mockReturnValueOnce(events([
        { type: "start", partial: assistantMessage() },
        { type: "done", reason: "stop", message: { ...assistantMessage([{ type: "text", text: "denied" }]), stopReason: "stop" } },
      ]));

    const session = new AgentSession({ model: mockModel, cwd: "/tmp", tools: [tool], maxLoopCount: 2 });
    session.addEventListener((event) => {
      if (event.type === "permission_request") session.resolvePermission(event.requestId, "deny");
    });

    await session.prompt("write file");

    expect(execute).not.toHaveBeenCalled();
    const toolResults = session.getMessages().filter((msg) => msg.role === "toolResult");
    expect(toolResults).toHaveLength(1);
    expect(toolResults[0]).toMatchObject({
      toolCallId: "tool-call_denied",
      toolName: "write",
      isError: true,
    });
    expect(toolResults[0]!.content).toEqual([{ type: "text", text: "Permission denied by user" }]);
  });

});
