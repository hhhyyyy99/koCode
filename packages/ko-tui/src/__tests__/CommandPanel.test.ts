import { describe, expect, it } from "vitest";
import { formatCommandRows, wrapText } from "../CommandPanel.js";
import type { CommandDef } from "../commands.js";
import { bottomLayoutOrder, commandInputText, slashCompletionInputText } from "../App.js";
import { insertText, setInputText } from "../input-buffer.js";

const noop: CommandDef["handler"] = () => {};

function command(name: string, description: string, source?: string, takesArgs = false): CommandDef {
  return { name, description, source, takesArgs, handler: noop };
}

describe("CommandPanel formatting", () => {
  it("aligns selected and unselected command rows", () => {
    const rows = formatCommandRows([
      command("/opsx:explore", "Enter explore mode"),
      command("/opsx:apply", "Implement tasks"),
    ], 0, 80);

    expect(rows[0]!.commandLine.startsWith("❯ /opsx:explore")).toBe(true);
    expect(rows[1]!.commandLine.startsWith("  /opsx:apply")).toBe(true);
    expect(rows[0]!.commandLine.indexOf("Enter explore mode")).toBe(rows[1]!.commandLine.indexOf("Implement tasks"));
  });

  it("renders optional source metadata as an indented continuation line", () => {
    const rows = formatCommandRows([
      command("/opsx:explore", "Enter explore mode", "project"),
    ], 0, 80);

    expect(rows[0]!.metadataLine).toBe("                                (project)");
  });

  it("wraps long descriptions under the description column", () => {
    const rows = formatCommandRows([
      command("/kimi-webbridge", "Kimi WebBridge lets AI control the user's real browser and interact with websites"),
    ], 0, 60);

    const lines = rows[0]!.commandLine.split("\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[1]!.startsWith("                                ")).toBe(true);
  });

  it("wraps text by words where possible", () => {
    expect(wrapText("alpha beta gamma", 10)).toEqual(["alpha beta", "gamma"]);
  });

  it("keeps command completions adjacent to the input before the status bar", () => {
    expect(bottomLayoutOrder(true)).toEqual(["input", "command-panel", "status-bar"]);
    expect(bottomLayoutOrder(false)).toEqual(["input", "status-bar"]);
  });

  it("places continued typing after a completed slash command", () => {
    const completed = commandInputText(command("/help", "Show help"));

    expect(insertText(setInputText(completed), "x")).toEqual({
      text: "/helpx",
      cursorOffset: 6,
    });
  });

  it("places argument typing after the trailing space for argument commands", () => {
    const completed = commandInputText(command("/model", "Switch model", undefined, true));

    expect(completed).toBe("/model ");
    expect(insertText(setInputText(completed), "openai/gpt-4.1")).toEqual({
      text: "/model openai/gpt-4.1",
      cursorOffset: 21,
    });
  });

  it("completes the highlighted command instead of the first command", () => {
    const commands = [
      command("/help", "Show help"),
      command("/clear", "Clear conversation history"),
      command("/compact", "Compact conversation context"),
    ];

    expect(slashCompletionInputText(commands, 2)).toBe("/compact");
  });

  it("completes highlighted argument commands with a trailing space", () => {
    const commands = [
      command("/help", "Show help"),
      command("/model", "Switch model", undefined, true),
    ];

    expect(slashCompletionInputText(commands, 1)).toBe("/model ");
  });

  it("does not complete when no command is selected", () => {
    expect(slashCompletionInputText([], 0)).toBeUndefined();
  });
});
