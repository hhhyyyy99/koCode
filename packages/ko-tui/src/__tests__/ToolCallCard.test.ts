import { describe, expect, it } from "vitest";
import { displayToolName, splitDisplayLines, toolOverflowHint, toolSummary, toolTitle } from "../ToolCallCard.js";
import type { ToolCallState } from "../types.js";

const tool: ToolCallState = {
  key: "0:0:tool-1",
  id: "tool-1",
  name: "bash",
  input: { command: "printf test" },
  status: "done",
  result: { isError: false, content: "ok" },
};

describe("ToolCallCard helpers", () => {
  it("renders visible focus in the title", () => {
    expect(toolTitle(tool, true)).toBe("❯ Bash(printf test)");
  });

  it("summarizes bash output with the result prefix line", () => {
    expect(toolSummary(tool)).toBe("ok");
  });

  it("uses Claude-style display names and write summaries", () => {
    expect(displayToolName("write")).toBe("Write");
    const writeTool: ToolCallState = {
      key: "0:0:tool-write",
      id: "tool-write",
      name: "write",
      input: { file_path: "./tmp-file.txt", content: "alpha\nbeta" },
      status: "done",
      result: { isError: false, content: "File written: ./tmp-file.txt" },
    };
    expect(toolTitle(writeTool, false)).toBe("✓ Write(tmp-file.txt)");
    expect(toolSummary(writeTool)).toBe("Wrote 2 lines to tmp-file.txt");

    const readTool: ToolCallState = {
      key: "0:0:tool-read-newline",
      id: "tool-read-newline",
      name: "read",
      input: { file_path: "./tmp-file.txt" },
      status: "done",
      result: { isError: false, content: "alpha\nbeta\n" },
    };
    expect(toolSummary(readTool)).toBe("Read 2 lines");
  });
  it("does not count a trailing newline as an extra display line", () => {
    expect(splitDisplayLines("alpha\nbeta\n")).toEqual(["alpha", "beta"]);
    const writeTool: ToolCallState = {
      key: "0:0:tool-write-newline",
      id: "tool-write-newline",
      name: "write",
      input: { file_path: "./tmp-file.txt", content: "alpha\nbeta\n" },
      status: "done",
      result: { isError: false, content: "File written: ./tmp-file.txt" },
    };
    expect(toolSummary(writeTool)).toBe("Wrote 2 lines to tmp-file.txt");

    const readTool: ToolCallState = {
      key: "0:0:tool-read-newline",
      id: "tool-read-newline",
      name: "read",
      input: { file_path: "./tmp-file.txt" },
      status: "done",
      result: { isError: false, content: "alpha\nbeta\n" },
    };
    expect(toolSummary(readTool)).toBe("Read 2 lines");
  });

  it("shows error content before tool-specific success summaries", () => {
    const deniedWrite: ToolCallState = {
      key: "0:0:tool-denied",
      id: "tool-denied",
      name: "write",
      input: { file_path: "./tmp-file.txt", content: "alpha\nbeta" },
      status: "error",
      result: { isError: true, content: "Permission denied by user" },
    };
    expect(toolSummary(deniedWrite)).toBe("Error: Permission denied by user");
  });

  it("keeps expand and collapse hints aligned with ctrl+o", () => {
    expect(toolOverflowHint(2, false)).toBe("… +2 lines (ctrl+o to expand)");
    expect(toolOverflowHint(2, true)).toBe("… +2 lines (ctrl+o to collapse)");
  });
});
