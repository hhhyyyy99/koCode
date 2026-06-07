import { describe, expect, it } from "vitest";
import type { Model } from "@kocode/ko-ai";
import { formatWelcomeLines } from "../Welcome.js";
import { formatHeaderLines } from "../Header.js";
import { filterCommands } from "../commands.js";

const model: Model = {
  id: "test-model",
  name: "Test Model",
  api: "openai-completions",
  provider: "test",
  reasoning: false,
  baseUrl: "https://example.invalid",
  input: ["text"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 200000,
  maxTokens: 1024,
};

describe("welcome layout", () => {
  it("uses the compact header as the startup identity surface", () => {
    expect(formatHeaderLines(model, "/repo", "1.2.3", false)).toEqual([
      "koCode v1.2.3",
      "test/test-model · 200k context",
      "/repo",
    ]);
  });

  it("omits separate logo artwork and duplicate startup text", () => {
    const lines = formatWelcomeLines(model, "/repo");

    expect(lines).toEqual([]);
    expect(lines).not.toContain("▐▛███▜▌");
    expect(lines).not.toContain("Welcome to koCode!");
    expect(lines).not.toContain("  /help   — Show available commands");
  });

  it("keeps command discovery available through slash commands", () => {
    expect(filterCommands("help").map((command) => command.name)).toContain("/help");
    expect(filterCommands("model").map((command) => command.name)).toContain("/model");
    expect(filterCommands("clear").map((command) => command.name)).toContain("/clear");
  });
});
