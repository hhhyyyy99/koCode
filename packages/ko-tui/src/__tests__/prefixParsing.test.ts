import { describe, expect, it } from "vitest";
import { parseInputRoute } from "../input-prefix.js";

describe("parseInputRoute", () => {
  it("routes empty input", () => {
    expect(parseInputRoute("   ")).toEqual({ type: "empty" });
  });

  it("routes shell prefix", () => {
    expect(parseInputRoute("! ls -la ")).toEqual({ type: "shell", command: "ls -la" });
  });

  it("routes memory prefix", () => {
    expect(parseInputRoute("# Use tabs")).toEqual({ type: "memory", content: "Use tabs" });
  });

  it("routes slash commands with arguments", () => {
    expect(parseInputRoute("/model anthropic/claude")).toEqual({
      type: "slash",
      command: "/model",
      args: "anthropic/claude",
    });
  });

  it("routes @ prefix as a file reference prompt", () => {
    expect(parseInputRoute("@./src explain this")).toEqual({
      type: "file_reference",
      path: "./src",
      message: "explain this",
      content: "Referenced file: ./src\n\nexplain this",
    });
  });

  it("routes plain text as a prompt", () => {
    expect(parseInputRoute("hello")).toEqual({ type: "prompt", content: "hello" });
  });
});
