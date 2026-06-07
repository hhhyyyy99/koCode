import { describe, expect, it } from "vitest";
import { AgentSession } from "@kocode/ko-agent";
import type { Model } from "@kocode/ko-ai";
import { filterCommands, formatContextBreakdown, formatDuration, formatUsageReport, getCommands } from "../commands.js";

const model: Model = {
  id: "test-model",
  name: "Test Model",
  api: "openai-completions",
  provider: "test",
  reasoning: false,
  baseUrl: "https://example.invalid",
  input: ["text"],
  cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 100000,
  maxTokens: 1024,
};

function makeSession() {
  return new AgentSession({ model, cwd: process.cwd(), tools: [] });
}

describe("command formatters", () => {
  it("includes the full 20+ command set", () => {
    const names = getCommands().map((command) => command.name);

    expect(names.length).toBeGreaterThanOrEqual(20);
    expect(names).toEqual(expect.arrayContaining([
      "/help",
      "/clear",
      "/compact",
      "/context",
      "/cost",
      "/diff",
      "/rewind",
      "/status",
      "/model",
      "/models",
      "/config",
      "/init",
      "/permissions",
      "/theme",
      "/resume",
      "/branch",
      "/quit",
      "/exit",
      "/feedback",
      "/doctor",
      "/export",
      "/review",
      "/skills",
    ]));
  });

  it("filters commands by name or fallback description", () => {
    expect(filterCommands("mod").map((command) => command.name)).toContain("/model");
    expect(filterCommands("token").map((command) => command.name)).toContain("/context");
  });

  it("uses command-name matches before description-only matches", () => {
    const names = filterCommands("/exit").map((command) => command.name);

    expect(names[0]).toBe("/exit");
    expect(names).not.toContain("/quit");
  });

  it("does not include description-only matches when an exact command name matches", () => {
    const names = filterCommands("/context").map((command) => command.name);

    expect(names).toContain("/context");
    expect(names).not.toContain("/compact");
  });

  it("does not include description-only matches when a command-name prefix matches", () => {
    const names = filterCommands("/con").map((command) => command.name);

    expect(names).toContain("/context");
    expect(names).toContain("/config");
    expect(names).not.toContain("/compact");
  });

  it("falls back to description matches when no command names match", () => {
    const names = filterCommands("token").map((command) => command.name);

    expect(names).toContain("/context");
  });

  it("preserves registry order for empty slash queries", () => {
    const defaultOrder = getCommands().map((command) => command.name);

    expect(filterCommands("").map((command) => command.name)).toEqual(defaultOrder);
    expect(filterCommands("/").map((command) => command.name)).toEqual(defaultOrder);
  });

  it("normalizes trailing whitespace after completed commands", () => {
    expect(filterCommands("/branch ")[0]?.name).toBe("/branch");
  });

  it("formats /context as a tree with health", () => {
    const output = formatContextBreakdown(makeSession());

    expect(output).toContain("Context breakdown:");
    expect(output).toContain("├ System prompt: ~");
    expect(output).toContain("CLAUDE.md");
    expect(output).toContain("└ Total: ~");
    expect(output).toContain("Health: green");
  });

  it("formats /cost with totals and model breakdown", () => {
    const output = formatUsageReport(makeSession());

    expect(output).toContain("Total cost: $");
    expect(output).toContain("Total API duration:");
    expect(output).toContain("Total wall duration:");
    expect(output).toContain("Code changes: +0 / -0");
    expect(output).toContain("Usage by model:");
    expect(output).toContain("test/test-model: input 0");
  });

  it("formats durations", () => {
    expect(formatDuration(14_000)).toBe("14s");
    expect(formatDuration(320_000)).toBe("5m 20s");
  });
  it("switches theme through command context", () => {
    const session = makeSession();
    const command = getCommands().find((cmd) => cmd.name === "/theme")!;
    const notifications: string[] = [];
    let selectedTheme = "dark";

    command.handler("light", session, (msg) => notifications.push(msg), {
      currentTheme: selectedTheme,
      setTheme: (name) => {
        selectedTheme = name;
        return true;
      },
    });

    expect(selectedTheme).toBe("light");
    expect(notifications).toContain("Theme switched to light");
  });

  it("reports unknown themes", () => {
    const session = makeSession();
    const command = getCommands().find((cmd) => cmd.name === "/theme")!;
    const notifications: string[] = [];

    command.handler("solarized", session, (msg) => notifications.push(msg), { currentTheme: "dark" });

    expect(notifications[0]).toContain("Unknown theme: solarized");
  });
  it("allows switching to the current custom model", () => {
    const session = makeSession();
    const command = getCommands().find((cmd) => cmd.name === "/model")!;
    const notifications: string[] = [];

    command.handler("test/test-model", session, (msg) => notifications.push(msg));

    expect(notifications).toContain("Switched to test/test-model");
  });
  it("rewinds through /rewind", async () => {
    const session = makeSession();
    const command = getCommands().find((cmd) => cmd.name === "/rewind")!;
    const notifications: string[] = [];
    let called = false;
    (session as any).rewindLastTurn = async () => {
      called = true;
      return ["file.txt"];
    };

    await command.handler("", session, (msg) => notifications.push(msg));

    expect(called).toBe(true);
    expect(notifications).toContain("Rewound: restored file.txt");
  });

});
