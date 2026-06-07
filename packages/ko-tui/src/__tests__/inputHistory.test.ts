import { describe, expect, it } from "vitest";
import { addHistoryEntry, searchHistory, selectHistoryMatch } from "../input-history.js";
import { insertText, setInputText } from "../input-buffer.js";

describe("input history helpers", () => {
  it("adds trimmed entries and keeps the newest values", () => {
    expect(addHistoryEntry([], "  first  ")).toEqual(["first"]);
    expect(addHistoryEntry(["a", "b"], "c", 2)).toEqual(["b", "c"]);
    expect(addHistoryEntry(["a"], "   ")).toEqual(["a"]);
  });

  it("searches case-insensitively", () => {
    expect(searchHistory(["Analyze repo", "Run tests", "review diff"], "RE")).toEqual([
      "Analyze repo",
      "review diff",
    ]);
  });

  it("cycles selected matches", () => {
    const matches = ["one", "two"];
    expect(selectHistoryMatch(matches, 0)).toBe("one");
    expect(selectHistoryMatch(matches, 2)).toBe("one");
    expect(selectHistoryMatch([], 0)).toBeUndefined();
  });

  it("restores selected entries with the cursor at the end", () => {
    const selected = selectHistoryMatch(["review diff"], 0)!;

    expect(insertText(setInputText(selected), " now")).toEqual({
      text: "review diff now",
      cursorOffset: 15,
    });
  });
});
