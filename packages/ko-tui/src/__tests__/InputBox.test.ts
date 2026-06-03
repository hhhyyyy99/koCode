import { describe, expect, it } from "vitest";
import { inputKeyAction, inputPlaceholder, inputPrompt, sanitizeTextInputValueForControls } from "../InputBox.js";

describe("InputBox helpers", () => {
  it("uses a running prompt without replacing input state", () => {
    expect(inputPrompt(true)).toBe("● ");
    expect(inputPlaceholder(true)).toContain("draft next message");
  });

  it("uses the idle input prompt", () => {
    expect(inputPrompt(false)).toBe("❯ ");
  });

  it("submits on bare return", () => {
    expect(inputKeyAction("\r", { return: true })).toBe("submit");
    expect(inputKeyAction("\r", {})).toBe("submit");
  });

  it("keeps explicit multiline shortcuts for newlines", () => {
    expect(inputKeyAction("\r", { meta: true, return: true })).toBe("newline");
    expect(inputKeyAction("\n", { ctrl: true })).toBe("newline");
  });

  it("removes bare escape bytes from text-input echoes and reports them", () => {
    expect(sanitizeTextInputValueForControls("draft", "draft\x1b")).toEqual({
      value: "draft",
      bareEscapeCount: 1,
    });
    expect(sanitizeTextInputValueForControls("draft", "draft\x1b\x1b")).toEqual({
      value: "draft",
      bareEscapeCount: 2,
    });
  });

  it("does not report escape sequences as bare escape presses", () => {
    expect(sanitizeTextInputValueForControls("draft", "draft\x1b[Z")).toEqual({
      value: "draft",
      bareEscapeCount: 0,
    });
    expect(sanitizeTextInputValueForControls("draft", "draft\x1b[A")).toEqual({
      value: "draft",
      bareEscapeCount: 0,
    });
  });
});
