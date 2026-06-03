import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processEvent } from "../useTurns.js";
import type { Turn } from "../types.js";
import type { AgentSessionEvent } from "@kocode/ko-agent";

function makeEvent(overrides: Partial<AgentSessionEvent> & { type: AgentSessionEvent["type"] }): AgentSessionEvent {
  return overrides as AgentSessionEvent;
}

describe("turn completion marker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records startedAt on turn_start and completedAt on turn_end", () => {
    const turns: Turn[] = [];

    // Create a turn
    processEvent(makeEvent({ type: "user_message", content: "hello" }), turns);

    // Set time and start turn
    vi.setSystemTime(1000);
    processEvent(makeEvent({ type: "turn_start" }), turns);

    // Advance time and end turn
    vi.setSystemTime(5000);
    processEvent(makeEvent({ type: "turn_end", usage: {} as any, stopReason: "stop" }), turns);

    expect(turns[0]!.startedAt).toBe(1000);
    expect(turns[0]!.completedAt).toBe(5000);
    expect(turns[0]!.status).toBe("complete");
  });

  it("duration is 4 seconds when start=1000 and end=5000", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "user_message", content: "hello" }), turns);

    vi.setSystemTime(1000);
    processEvent(makeEvent({ type: "turn_start" }), turns);

    vi.setSystemTime(5000);
    processEvent(makeEvent({ type: "turn_end", usage: {} as any, stopReason: "stop" }), turns);

    const duration = turns[0]!.completedAt! - turns[0]!.startedAt!;
    expect(duration).toBe(4000);
  });

  it("does not crash if turn_end received before turn_start", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "user_message", content: "hello" }), turns);
    processEvent(makeEvent({ type: "turn_end", usage: {} as any, stopReason: "stop" }), turns);

    expect(turns[0]!.status).toBe("complete");
    expect(turns[0]!.startedAt).toBeUndefined();
  });

  it("updates startedAt on duplicate turn_start (last wins)", () => {
    const turns: Turn[] = [];

    processEvent(makeEvent({ type: "user_message", content: "hello" }), turns);

    vi.setSystemTime(1000);
    processEvent(makeEvent({ type: "turn_start" }), turns);
    vi.setSystemTime(2000);
    processEvent(makeEvent({ type: "turn_start" }), turns); // duplicate, last write wins

    expect(turns[0]!.startedAt).toBe(2000);
  });
});
