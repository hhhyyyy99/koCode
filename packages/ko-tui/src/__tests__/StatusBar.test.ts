import { describe, expect, it } from "vitest";
import {
  buildStatusBarFields,
  formatContextPressure,
  formatCostAbbrev,
  layoutStatusBarLine,
} from "../StatusBar.js";

describe("StatusBar layout", () => {
  it("formats context pressure as percent", () => {
    expect(formatContextPressure(50_000, 200_000)).toBe("25%");
    expect(formatContextPressure(0, 0)).toBe("");
  });

  it("abbreviates cost", () => {
    expect(formatCostAbbrev(0)).toBe("$0");
    expect(formatCostAbbrev(0.1234)).toBe("$0.12");
  });

  it("idle fields include mode context and shortcuts", () => {
    const fields = buildStatusBarFields({
      running: false,
      permissionMode: "default",
      contextPressure: "25%",
      costLabel: "$0.12",
      gitBranch: "main",
    });
    expect(fields.mode).toContain("Default");
    expect(fields.context).toBe("25%");
    expect(fields.shortcuts).toContain("shortcut");
    expect(fields.running).toBeNull();
  });

  it("running retains a running signal", () => {
    const fields = buildStatusBarFields({
      running: true,
      permissionMode: "default",
      contextPressure: "10%",
    });
    expect(fields.running).toBe("Running");
    const line = layoutStatusBarLine(fields, 80);
    expect(line).toContain("Running");
  });

  it("drops git then cost before must fields on narrow width", () => {
    const fields = buildStatusBarFields({
      running: true,
      permissionMode: "default",
      contextPressure: "42%",
      costLabel: "$1.23",
      gitBranch: "feature/very-long-branch-name",
    });
    const narrow = layoutStatusBarLine(fields, 36);
    expect(narrow).not.toContain("feature/very-long-branch-name");
    // Still keeps a runtime signal
    expect(narrow.includes("Running") || narrow.includes("Def") || narrow.includes("Default")).toBe(true);
  });

  it("never drops both running and mode when both present", () => {
    const fields = buildStatusBarFields({
      running: true,
      permissionMode: "accept_edits",
      contextPressure: "99%",
      costLabel: "$9.99",
      gitBranch: "main",
    });
    const tiny = layoutStatusBarLine(fields, 24);
    const hasRunning = tiny.includes("Running");
    const hasMode = /Edit|Accept|Def|Auto|default/i.test(tiny);
    expect(hasRunning || hasMode).toBe(true);
    // Prefer keeping at least one; policy forbids dropping both
    if (hasRunning && !hasMode) {
      // ok
    } else if (hasMode && !hasRunning) {
      // ok only if running was compressed last — still one signal
    } else {
      expect(hasRunning && hasMode).toBe(true);
    }
  });
});
