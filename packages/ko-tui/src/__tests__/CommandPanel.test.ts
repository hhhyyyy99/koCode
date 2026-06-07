import { describe, expect, it } from "vitest";
import { formatCommandRows, wrapText } from "../CommandPanel.js";
import type { CommandDef } from "../commands.js";
import { bottomLayoutOrder } from "../App.js";

const noop: CommandDef["handler"] = () => {};

function command(name: string, description: string, source?: string): CommandDef {
  return { name, description, source, handler: noop };
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
});
