import { describe, expect, it } from "vitest";
import {
  formatThinkingPreview,
  thinkingCollapsedLine,
  thinkingExpandedHeader,
  thinkingToggleHint,
} from "../ThinkingBlock.js";

describe("ThinkingBlock display helpers", () => {
  it("renders collapsed thinking with the Ctrl+O expand hint", () => {
    expect(thinkingCollapsedLine("alpha\nbeta", false)).toBe(
      "💭 alpha beta (ctrl+o to expand)",
    );
    expect(thinkingCollapsedLine("alpha\nbeta", true)).toBe(
      "❯ alpha beta (ctrl+o to expand)",
    );
  });

  it("renders focused expanded thinking with the Ctrl+O collapse hint", () => {
    expect(thinkingExpandedHeader(true)).toBe("❯ Thinking (ctrl+o to collapse)");
    expect(thinkingExpandedHeader(false)).toBe("💭 Thinking (ctrl+o to collapse)");
  });

  it("keeps thinking previews compact and single-line", () => {
    expect(formatThinkingPreview("  first\nsecond\tthird  ")).toBe("first second third");
    expect(formatThinkingPreview("x".repeat(100))).toBe(`${"x".repeat(77)}...`);
  });

  it("uses Ctrl+O hints for expansion instead of Enter hints", () => {
    expect(thinkingToggleHint(false)).toBe("ctrl+o to expand");
    expect(thinkingToggleHint(true)).toBe("ctrl+o to collapse");
    expect(thinkingCollapsedLine("alpha", true)).not.toContain("enter");
    expect(thinkingExpandedHeader(true)).not.toContain("enter");
  });
});
