import { describe, expect, it } from "vitest";
import {
  controlledInputDisplay,
  inputKeyAction,
  inputPlaceholder,
  inputPrompt,
  printableInput,
  sanitizeTextInputValueForControls,
} from "../InputBox.js";
import { insertText, setInputText } from "../input-buffer.js";
import { horizontalSeparator } from "../layout.js";

describe("InputBox helpers", () => {
  it("uses a running prompt without replacing input state", () => {
    expect(inputPrompt(true)).toBe("● ");
    expect(inputPlaceholder(true)).toContain("draft next message");
  });

  it("uses the idle input prompt", () => {
    expect(inputPrompt(false)).toBe("❯ ");
  });

  it("uses separator-frame layout helpers without changing prompt text", () => {
    expect(horizontalSeparator(8)).toBe("────────");
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

  it("formats controlled cursor display for focused input", () => {
    expect(controlledInputDisplay("/help", 5, "placeholder", true)).toEqual({
      before: "/help",
      cursor: " ",
      after: "",
      placeholder: false,
    });
    expect(controlledInputDisplay("/help", 1, "placeholder", true)).toEqual({
      before: "/",
      cursor: "h",
      after: "elp",
      placeholder: false,
    });
  });

  it("formats controlled placeholder display", () => {
    expect(controlledInputDisplay("", 0, "输入消息", true)).toEqual({
      before: "",
      cursor: "输",
      after: "入消息",
      placeholder: true,
    });
    expect(controlledInputDisplay("", 0, "输入消息", false)).toEqual({
      before: "",
      cursor: "",
      after: "输入消息",
      placeholder: true,
    });
  });

  it("inserts explicit multiline shortcuts at the cursor position", () => {
    const buffer = setInputText("abcd", 2);

    expect(insertText(buffer, "\n")).toEqual({
      text: "ab\ncd",
      cursorOffset: 3,
    });
  });

  it("does not treat slash navigation keys as printable input", () => {
    expect(printableInput("x", { tab: true })).toBe("");
    expect(printableInput("x", { upArrow: true })).toBe("");
    expect(printableInput("x", { downArrow: true })).toBe("");
    expect(printableInput("x", { ctrl: true })).toBe("");
    expect(printableInput("x", {})).toBe("x");
  });
});
