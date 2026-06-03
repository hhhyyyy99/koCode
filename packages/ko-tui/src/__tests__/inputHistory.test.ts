import { describe, expect, it } from "vitest";
import { addHistoryEntry, searchHistory, selectHistoryMatch } from "../input-history.js";

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
});
