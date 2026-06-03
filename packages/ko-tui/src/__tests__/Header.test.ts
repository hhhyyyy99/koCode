import { describe, expect, it } from "vitest";
import type { Model } from "@kocode/ko-ai";
import { formatHeaderLines } from "../Header.js";

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

describe("formatHeaderLines", () => {
  it("returns the full welcome-mode information hierarchy", () => {
    expect(formatHeaderLines(model, "/repo", "1.2.3", false)).toEqual([
      "koCode v1.2.3",
      "test/test-model · 200k context",
      "/repo",
    ]);
  });

  it("returns compact conversation-mode header lines", () => {
    expect(formatHeaderLines(model, "/repo", "1.2.3", true)).toEqual([
      "koCode v1.2.3 · test/test-model · 200k context",
      "/repo",
    ]);
  });
});
