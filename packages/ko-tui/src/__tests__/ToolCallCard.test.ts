import { describe, expect, it } from "vitest";
import {
  displayToolName,
  editChangeScale,
  formatToolParams,
  splitDisplayLines,
  toolOverflowHint,
  toolSummary,
  toolTitle,
} from "../ToolCallCard.js";
import type { ToolCallState } from "../types.js";

function tool(partial: Partial<ToolCallState> & Pick<ToolCallState, "name" | "id">): ToolCallState {
  return {
    key: `0:0:${partial.id}`,
    input: {},
    status: "done",
    result: { isError: false, content: "" },
    ...partial,
  };
}

describe("ToolCallCard helpers", () => {
  it("renders visible focus in the title", () => {
    const t = tool({
      id: "tool-1",
      name: "bash",
      input: { command: "printf test" },
      result: { isError: false, content: "ok" },
    });
    expect(toolTitle(t, true)).toBe("❯ Bash(printf test)");
  });

  it("summarizes bash with a short gist not full stdout", () => {
    const long = "line1\n" + "x".repeat(200);
    const t = tool({
      id: "bash-long",
      name: "bash",
      input: { command: "yes | head" },
      result: { isError: false, content: long },
    });
    const summary = toolSummary(t);
    expect(summary.length).toBeLessThanOrEqual(80);
    expect(summary).not.toContain("x".repeat(100));
    expect(summary.startsWith("line1")).toBe(true);
  });

  it("uses specialized write and read summaries", () => {
    expect(displayToolName("write")).toBe("Write");
    const writeTool = tool({
      id: "tool-write",
      name: "write",
      input: { file_path: "./tmp-file.txt", content: "alpha\nbeta" },
      result: { isError: false, content: "File written: ./tmp-file.txt" },
    });
    expect(toolTitle(writeTool, false)).toBe("✓ Write(tmp-file.txt)");
    expect(toolSummary(writeTool)).toBe("Wrote 2 lines to tmp-file.txt");

    const readTool = tool({
      id: "tool-read",
      name: "read",
      input: { file_path: "./tmp-file.txt" },
      result: { isError: false, content: "alpha\nbeta\n" },
    });
    expect(toolSummary(readTool)).toBe("Read 2 lines");
  });

  it("includes edit change scale in collapsed summary", () => {
    expect(editChangeScale("a\nb\n", "a\nb\nc\n")).toBe("-2/+3");
    const editTool = tool({
      id: "edit-1",
      name: "edit",
      input: {
        file_path: "./src/a.ts",
        old_string: "one\ntwo",
        new_string: "one\ntwo\nthree",
      },
      result: { isError: false, content: "ok" },
    });
    expect(toolSummary(editTool)).toContain("a.ts");
    expect(toolSummary(editTool)).toMatch(/-2\/\+3|lines changed/);
  });

  it("specializes grep find and ls summaries", () => {
    const grepTool = tool({
      id: "grep-1",
      name: "grep",
      input: { pattern: "TODO" },
      result: { isError: false, content: "a.ts:1:TODO\nb.ts:2:TODO" },
    });
    expect(toolSummary(grepTool)).toContain("TODO");
    expect(toolSummary(grepTool).toLowerCase()).toMatch(/hit|match/);

    const grepZero = tool({
      id: "grep-0",
      name: "grep",
      input: { pattern: "ZZZ" },
      result: { isError: false, content: "" },
    });
    expect(toolSummary(grepZero).toLowerCase()).toContain("no match");

    const findTool = tool({
      id: "find-1",
      name: "find",
      input: { pattern: "*.ts" },
      result: { isError: false, content: "a.ts\nb.ts" },
    });
    expect(toolSummary(findTool)).toContain("2 result");

    const lsTool = tool({
      id: "ls-1",
      name: "ls",
      input: { path: "./src" },
      result: { isError: false, content: "a.ts\nb.ts\nc.ts" },
    });
    expect(toolSummary(lsTool)).toContain("src");
    expect(toolSummary(lsTool)).toContain("3");
  });

  it("uses human-readable unknown fallback without JSON dump", () => {
    const unknown = tool({
      id: "mcp-1",
      name: "mcp__something__tool",
      input: { query: "hello world", nested: { a: 1 } },
      result: { isError: false, content: "result body line" },
    });
    const summary = toolSummary(unknown);
    expect(summary).toContain("result body");
    expect(summary).not.toContain("JSON");
    expect(formatToolParams(unknown.input)).toBe("hello world");
    expect(formatToolParams(unknown.input)).not.toContain("{");
  });

  it("does not count a trailing newline as an extra display line", () => {
    expect(splitDisplayLines("alpha\nbeta\n")).toEqual(["alpha", "beta"]);
  });

  it("shows error content before tool-specific success summaries", () => {
    const deniedWrite = tool({
      id: "tool-denied",
      name: "write",
      status: "error",
      input: { file_path: "./tmp-file.txt", content: "alpha\nbeta" },
      result: { isError: true, content: "Permission denied by user" },
    });
    expect(toolSummary(deniedWrite)).toBe("Error: Permission denied by user");
  });

  it("keeps expand and collapse hints aligned with ctrl+o", () => {
    expect(toolOverflowHint(2, false)).toBe("… +2 lines (ctrl+o to expand)");
    expect(toolOverflowHint(2, true)).toBe("… +2 lines (ctrl+o to collapse)");
  });

  it("running tools have empty success summary", () => {
    const running = tool({
      id: "run-1",
      name: "read",
      status: "running",
      input: { file_path: "./a.ts" },
      result: undefined,
    });
    expect(toolSummary(running)).toBe("");
  });
});
