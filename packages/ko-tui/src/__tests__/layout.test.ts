import { describe, expect, it } from "vitest";
import { FALLBACK_TERMINAL_WIDTH, horizontalSeparator, resolveTerminalWidth } from "../layout.js";

describe("layout helpers", () => {
  it("uses a stable fallback width when no terminal width is available", () => {
    expect(resolveTerminalWidth(undefined)).toBe(FALLBACK_TERMINAL_WIDTH);
    expect(horizontalSeparator(undefined)).toHaveLength(FALLBACK_TERMINAL_WIDTH);
  });

  it("uses explicit terminal width when provided", () => {
    expect(resolveTerminalWidth(120)).toBe(120);
    expect(horizontalSeparator(12)).toBe("────────────");
  });

  it("ignores invalid widths", () => {
    expect(resolveTerminalWidth(0)).toBe(FALLBACK_TERMINAL_WIDTH);
    expect(resolveTerminalWidth(Number.NaN)).toBe(FALLBACK_TERMINAL_WIDTH);
  });
});
