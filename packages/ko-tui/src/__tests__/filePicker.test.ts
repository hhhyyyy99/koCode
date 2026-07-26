import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyCandidate,
  atTokenAt,
  deriveFilePickerState,
  filePickerKeyAction,
  listFileCandidates,
  type FileCandidate,
} from "../file-picker.js";

describe("atTokenAt", () => {
  it("finds the @ token at input start", () => {
    expect(atTokenAt("@", 1)).toEqual({ start: 0, fragment: "" });
    expect(atTokenAt("@src", 4)).toEqual({ start: 0, fragment: "src" });
  });

  it("finds a mid-sentence whitespace-preceded token", () => {
    expect(atTokenAt("fix @src/a.ts", 8)).toEqual({ start: 4, fragment: "src" });
  });

  it("rejects @ inside a word", () => {
    expect(atTokenAt("a@b", 3)).toBeUndefined();
    expect(atTokenAt("mail me@example", 15)).toBeUndefined();
  });

  it("returns undefined when the cursor left the token", () => {
    expect(atTokenAt("@src done", 9)).toBeUndefined();
    expect(atTokenAt("@src", 0)).toBeUndefined();
  });

  it("uses the text between @ and cursor as fragment", () => {
    expect(atTokenAt("@packages/ko-tui", 10)).toEqual({ start: 0, fragment: "packages/" });
  });
});

describe("listFileCandidates", () => {
  let cwd: string;

  beforeAll(() => {
    cwd = mkdtempSync(join(tmpdir(), "kocode-picker-"));
    mkdirSync(join(cwd, "packages"));
    mkdirSync(join(cwd, "packages", "ko-tui"));
    mkdirSync(join(cwd, "node_modules"));
    mkdirSync(join(cwd, "dist"));
    mkdirSync(join(cwd, ".git"));
    writeFileSync(join(cwd, "package.json"), "{}");
    writeFileSync(join(cwd, "README.md"), "");
    writeFileSync(join(cwd, ".env"), "");
    writeFileSync(join(cwd, "packages", "note.txt"), "");
  });

  afterAll(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it("lists the cwd root for an empty fragment without noise or dotfiles", () => {
    const names = listFileCandidates(cwd, "").map((c) => c.name);
    expect(names).toEqual(["packages", "package.json", "README.md"]);
  });

  it("ranks directory prefix matches before file matches within a tier", () => {
    const paths = listFileCandidates(cwd, "pack").map((c) => c.path);
    expect(paths).toEqual(["packages/", "package.json"]);
  });

  it("lists one directory level for dir fragments", () => {
    const names = listFileCandidates(cwd, "packages/").map((c) => c.name);
    expect(names).toEqual(["ko-tui", "note.txt"]);
    const filtered = listFileCandidates(cwd, "packages/ko").map((c) => c.path);
    expect(filtered).toEqual(["packages/ko-tui/"]);
  });

  it("ranks contains matches after prefix matches", () => {
    const names = listFileCandidates(cwd, "a").map((c) => c.name);
    expect(names).toEqual(["packages", "package.json", "README.md"]);
  });

  it("shows dotfiles only for dot fragments and never noise dirs", () => {
    const dotNames = listFileCandidates(cwd, ".").map((c) => c.name);
    expect(dotNames).toContain(".env");
    expect(dotNames).not.toContain(".git");
    expect(listFileCandidates(cwd, "").map((c) => c.name)).not.toContain(".env");
  });

  it("returns [] for escapes, absolute paths, and missing dirs", () => {
    expect(listFileCandidates(cwd, "../")).toEqual([]);
    expect(listFileCandidates(cwd, "/etc/")).toEqual([]);
    expect(listFileCandidates(cwd, "missing-dir/")).toEqual([]);
  });

  it("caps candidates at the limit", () => {
    expect(listFileCandidates(cwd, "", 2)).toHaveLength(2);
  });
});

describe("applyCandidate", () => {
  const file: FileCandidate = { path: "src/a.ts", name: "a.ts", isDirectory: false };
  const dir: FileCandidate = { path: "src/", name: "src", isDirectory: true };

  it("inserts a file path with trailing space and closes", () => {
    const applied = applyCandidate("fix @sr now", 7, 4, file);
    expect(applied.text).toBe("fix @src/a.ts  now");
    expect(applied.cursorOffset).toBe(14);
    expect(applied.keepOpen).toBe(false);
  });

  it("inserts a directory path with trailing slash and stays open", () => {
    const applied = applyCandidate("@s", 2, 0, dir);
    expect(applied.text).toBe("@src/");
    expect(applied.cursorOffset).toBe(5);
    expect(applied.keepOpen).toBe(true);
  });
});

describe("deriveFilePickerState", () => {
  const list = (fragment: string): FileCandidate[] => [
    { path: `${fragment}x`, name: "x", isDirectory: false },
  ];

  it("opens on an @ token and closes when the token is gone", () => {
    const state = deriveFilePickerState(null, "@s", 2, false, list);
    expect(state).toEqual({ tokenStart: 0, fragment: "s", candidates: [{ path: "sx", name: "x", isDirectory: false }], selectedIndex: 0 });
    expect(deriveFilePickerState(state, "hello", 5, false, list)).toBeNull();
  });

  it("never opens while slash mode is active", () => {
    expect(deriveFilePickerState(null, "/model @s", 9, true, list)).toBeNull();
  });

  it("preserves state (and selection) for an unchanged token", () => {
    const prev = { tokenStart: 0, fragment: "s", candidates: list("s"), selectedIndex: 3 };
    expect(deriveFilePickerState(prev, "@s", 2, false, list)).toBe(prev);
  });

  it("resets selection when the fragment changes", () => {
    const prev = { tokenStart: 0, fragment: "s", candidates: list("s"), selectedIndex: 3 };
    const next = deriveFilePickerState(prev, "@sr", 3, false, list);
    expect(next?.selectedIndex).toBe(0);
    expect(next?.fragment).toBe("sr");
  });
});

describe("filePickerKeyAction", () => {
  it("maps navigation, insertion, and dismissal keys", () => {
    expect(filePickerKeyAction("", { upArrow: true })).toBe("previous");
    expect(filePickerKeyAction("", { tab: true, shift: true })).toBe("previous");
    expect(filePickerKeyAction("", { downArrow: true })).toBe("next");
    expect(filePickerKeyAction("", { tab: true })).toBe("insert");
    expect(filePickerKeyAction("", { return: true })).toBe("insert");
    expect(filePickerKeyAction("\r", {})).toBe("insert");
    expect(filePickerKeyAction("", { escape: true })).toBe("dismiss");
    expect(filePickerKeyAction("\x1b", {})).toBe("dismiss");
  });

  it("lets every other key fall through to editing", () => {
    expect(filePickerKeyAction("s", {})).toBe("none");
    expect(filePickerKeyAction("o", {})).toBe("none");
    expect(filePickerKeyAction("\x1b[A", {})).toBe("none");
  });
});
