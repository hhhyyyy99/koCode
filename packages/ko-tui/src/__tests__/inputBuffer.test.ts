import { describe, expect, it } from "vitest";
import {
  clampCursorOffset,
  deleteBackward,
  deleteForward,
  emptyInputBuffer,
  insertText,
  moveCursor,
  replaceRange,
  setInputText,
} from "../input-buffer.js";

describe("input buffer helpers", () => {
  it("creates buffers with clamped cursor offsets", () => {
    expect(emptyInputBuffer()).toEqual({ text: "", cursorOffset: 0 });
    expect(setInputText("abc")).toEqual({ text: "abc", cursorOffset: 3 });
    expect(setInputText("abc", -1)).toEqual({ text: "abc", cursorOffset: 0 });
    expect(setInputText("abc", 99)).toEqual({ text: "abc", cursorOffset: 3 });
    expect(clampCursorOffset("abc", Number.NaN)).toBe(3);
  });

  it("inserts text at the current cursor and moves after the insertion", () => {
    const buffer = setInputText("/help", 1);

    expect(insertText(buffer, "x")).toEqual({
      text: "/xhelp",
      cursorOffset: 2,
    });
    expect(insertText(setInputText("/help"), " x")).toEqual({
      text: "/help x",
      cursorOffset: 7,
    });
  });

  it("handles multi-character paste-like insertion", () => {
    expect(insertText(setInputText("ac", 1), "bbb")).toEqual({
      text: "abbbc",
      cursorOffset: 4,
    });
  });

  it("deletes backward and forward around the cursor", () => {
    expect(deleteBackward(setInputText("abc", 2))).toEqual({ text: "ac", cursorOffset: 1 });
    expect(deleteBackward(setInputText("abc", 0))).toEqual({ text: "abc", cursorOffset: 0 });
    expect(deleteForward(setInputText("abc", 1))).toEqual({ text: "ac", cursorOffset: 1 });
    expect(deleteForward(setInputText("abc", 3))).toEqual({ text: "abc", cursorOffset: 3 });
  });

  it("moves the cursor within bounds", () => {
    expect(moveCursor(setInputText("abc", 1), "left")).toEqual({ text: "abc", cursorOffset: 0 });
    expect(moveCursor(setInputText("abc", 1), "right")).toEqual({ text: "abc", cursorOffset: 2 });
    expect(moveCursor(setInputText("abc", 0), "left")).toEqual({ text: "abc", cursorOffset: 0 });
    expect(moveCursor(setInputText("abc", 3), "right")).toEqual({ text: "abc", cursorOffset: 3 });
  });

  it("replaces ranges and places the cursor after replacement by default", () => {
    expect(replaceRange(setInputText("abcdef", 2), 1, 4, "XYZ")).toEqual({
      text: "aXYZef",
      cursorOffset: 4,
    });
    expect(replaceRange(setInputText("abcdef", 2), 4, 1, "XYZ", 1)).toEqual({
      text: "aXYZef",
      cursorOffset: 1,
    });
  });
});
