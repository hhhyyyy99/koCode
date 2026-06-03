import { describe, expect, it, vi } from "vitest";
import type { AssistantMessage, AssistantMessageEvent, Model, Usage } from "@kocode/ko-ai";

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

function usage(partial: Partial<Usage>): Usage {
  const { cost, ...rest } = partial;
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    ...rest,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, ...cost },
  };
}

function assistantMessage(messageUsage: Usage): AssistantMessage {
  return {
    role: "assistant",
    content: [{ type: "text", text: "ok" }],
    api: mockModel.api,
    provider: mockModel.provider,
    model: mockModel.id,
    usage: messageUsage,
    stopReason: "stop",
    timestamp: Date.now(),
  };
}

async function* events(items: AssistantMessageEvent[]) {
  for (const item of items) yield item;
}

describe("AgentSession usage normalization", () => {
  it("fills missing input tokens and computes cost before accumulating usage", async () => {
    const reportedUsage = usage({ output: 76 });
    const done = assistantMessage(reportedUsage);
    streamMock.mockReturnValueOnce(events([
      { type: "start", partial: assistantMessage(usage({})) },
      { type: "done", reason: "stop", message: done },
    ]));

    const session = new AgentSession({ model: mockModel, cwd: process.cwd(), tools: [] });
    await session.prompt("请只回复：ok");

    const total = session.getUsage();
    const byModel = session.getUsageByModel()["anthropic/claude-sonnet-4-5-20250514"];

    expect(total.input).toBeGreaterThan(0);
    expect(total.output).toBe(76);
    expect(total.totalTokens).toBeGreaterThanOrEqual(total.input + total.output);
    expect(total.cost.total).toBeGreaterThan(0);
    expect(total.cost.output).toBeCloseTo((15 / 1_000_000) * 76);
    expect(byModel?.input).toBe(total.input);
    expect(byModel?.cost.total).toBe(total.cost.total);
  });
});
