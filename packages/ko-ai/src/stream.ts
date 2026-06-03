import type { AssistantMessage, StopReason } from "./types.js";
import type { AssistantMessageEvent } from "./events.js";

// ============================================================================
// AssistantMessageEventStream — push-based stream that also exposes
// AsyncIterable for for-await-of consumption.
//
// Contract (from types.ts):
//   - Provider never throws. Failures are encoded as { type: "error" } events.
//   - The stream ends with exactly one terminal event: "done" or "error".
//   - After the terminal event no more events are pushed.
// ============================================================================

export class AssistantMessageEventStream implements AsyncIterable<AssistantMessageEvent> {
  private buffer: AssistantMessageEvent[] = [];
  private resolveNext: ((value: IteratorResult<AssistantMessageEvent>) => void) | null = null;
  private ended = false;
  private terminalMessage: AssistantMessage | null = null;

  push(event: AssistantMessageEvent): void {
    if (this.ended) return;
    this.buffer.push(event);

    if (event.type === "done" || event.type === "error") {
      this.ended = true;
      this.terminalMessage = event.type === "done" ? event.message : event.error;
    }

    // Wake up waiting async iterator consumer
    this.resolveNext?.({ value: event, done: false });
    this.resolveNext = null;
  }

  /** Signal stream end. If no terminal event was pushed, emits an "error" event. */
  end(message?: AssistantMessage): void {
    if (this.ended) return;
    if (message) {
      this.terminalMessage = message;
    }
    this.ended = true;
    this.resolveNext?.({ value: undefined as any, done: true });
    this.resolveNext = null;
  }

  /** Wait for the stream to finish and return the final AssistantMessage. */
  async result(): Promise<AssistantMessage> {
    if (this.terminalMessage) return this.terminalMessage;

    for await (const event of this) {
      if (event.type === "done") return event.message;
      if (event.type === "error") return event.error;
    }
    throw new Error("Stream ended without a terminal event");
  }

  // ── AsyncIterable ──────────────────────────────────────────────────────────

  [Symbol.asyncIterator](): AsyncIterator<AssistantMessageEvent> {
    let index = 0;

    const next = async (): Promise<IteratorResult<AssistantMessageEvent>> => {
      // Return buffered events first
      if (index < this.buffer.length) {
        const value = this.buffer[index++]!;
        return { value, done: false };
      }

      // If stream ended and buffer exhausted, signal done
      if (this.ended) {
        return { value: undefined as any, done: true };
      }

      // Wait for next push()
      return new Promise<IteratorResult<AssistantMessageEvent>>((resolve) => {
        this.resolveNext = resolve;
      });
    };

    return { next };
  }
}
