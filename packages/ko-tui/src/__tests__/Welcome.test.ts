import { describe, expect, it } from "vitest";
import type { Model } from "@kocode/ko-ai";
import { formatWelcomeLines } from "../Welcome.js";

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

describe("formatWelcomeLines", () => {
  it("includes logo, model, cwd, and required tips", () => {
    const lines = formatWelcomeLines(model, "/repo");

    expect(lines).toContain("▐▛███▜▌");
    expect(lines).toContain("Welcome to koCode!");
    expect(lines).toContain("test/test-model · 200k context");
    expect(lines).toContain("/repo");
    expect(lines).toContain("  /help   — Show available commands");
    expect(lines).toContain("  /model  — Switch model (/model <provider/id>)");
    expect(lines).toContain("  /clear  — Clear conversation");
  });
});
