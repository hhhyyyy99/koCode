import { describe, it, expect } from "vitest";
import { AssistantMessageEventStream } from "../stream";
import type { AssistantMessage } from "../types";
import { registerProvider, getProvider, clearProviders } from "../provider-registry";
import { calculateCost } from "../types";
import { getModel, getProviders, getModels } from "../models";
import { getEnvApiKey } from "../env-api-keys";

function makePartial(overrides?: Partial<AssistantMessage>): AssistantMessage {
  return {
    role: "assistant",
    content: [],
    api: "anthropic-messages",
    provider: "anthropic",
    model: "test",
    usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
    stopReason: "stop",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("AssistantMessageEventStream", () => {
  it("emits events in order and resolves result", async () => {
    const s = new AssistantMessageEventStream();
    const p = makePartial();

    s.push({ type: "start", partial: p });
    s.push({ type: "text_start", contentIndex: 0, partial: p });
    s.push({ type: "text_delta", contentIndex: 0, delta: "hello", partial: p });
    s.push({ type: "text_end", contentIndex: 0, content: "hello", partial: p });
    s.push({ type: "done", reason: "stop", message: p });

    const events: string[] = [];
    for await (const e of s) {
      events.push(e.type);
    }
    expect(events).toEqual(["start", "text_start", "text_delta", "text_end", "done"]);

    const result = await s.result();
    expect(result.role).toBe("assistant");
  });

  it("handles error terminal events", async () => {
    const s = new AssistantMessageEventStream();
    const p = makePartial({ stopReason: "error", errorMessage: "test error" });
    s.push({ type: "error", reason: "error", error: p });

    const result = await s.result();
    expect(result.stopReason).toBe("error");
    expect(result.errorMessage).toBe("test error");
  });

  it("result() returns the final message after stream ends", async () => {
    const s = new AssistantMessageEventStream();
    const p = makePartial();

    s.push({ type: "done", reason: "stop", message: p });

    // After the stream is terminated, result() returns immediately
    const result = await s.result();
    expect(result.role).toBe("assistant");
    expect(result.stopReason).toBe("stop");
  });
});

describe("Provider registry", () => {
  it("registers and retrieves providers", () => {
    clearProviders();
    registerProvider({
      api: "anthropic-messages",
      stream: () => ({} as any),
      streamSimple: () => ({} as any),
    });
    const p = getProvider("anthropic-messages");
    expect(p.api).toBe("anthropic-messages");
    clearProviders();
  });

  it("throws for unknown api", () => {
    clearProviders();
    expect(() => getProvider("unknown-api")).toThrow();
  });
});

describe("calculateCost", () => {
  it("computes per-million token costs", () => {
    const cost = calculateCost(3, 15, 0.3, 3.75, { input: 1000000, output: 500000, cacheRead: 200000, cacheWrite: 100000 });
    expect(cost.input).toBeCloseTo(3);
    expect(cost.output).toBeCloseTo(7.5);
    expect(cost.cacheRead).toBeCloseTo(0.06);
    expect(cost.cacheWrite).toBeCloseTo(0.375);
  });
});

describe("Model registry", () => {
  it("returns built-in models", () => {
    const providers = getProviders();
    expect(providers).toContain("anthropic");
    const model = getModel("anthropic", "claude-sonnet-4-5-20250514");
    expect(model.api).toBe("anthropic-messages");
    expect(model.contextWindow).toBeGreaterThan(0);
  });
});

describe("env-api-keys", () => {
  it("reads provider env vars", () => {
    process.env.ANTHROPIC_API_KEY = "test-key-ant";
    expect(getEnvApiKey("anthropic")).toBe("test-key-ant");
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("falls back to KOCODE_API_KEY", () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.KOCODE_API_KEY = "test-key-global";
    expect(getEnvApiKey("anthropic")).toBe("test-key-global");
    delete process.env.KOCODE_API_KEY;
  });
});
