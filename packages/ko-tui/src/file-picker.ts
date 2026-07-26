import { readdirSync } from "node:fs";
import { resolve, sep } from "node:path";
import { isBareEscapeInput } from "./focus.js";

export interface AtToken {
  /** Offset of the `@` character in the input text. */
  start: number;
  /** Text between `@` and the cursor. Never contains whitespace. */
  fragment: string;
}

/**
 * Find the `@` token containing the cursor. The `@` must be at input start or
 * preceded by whitespace, and the cursor must sit inside or at the end of the
 * token (no whitespace between `@` and cursor).
 */
export function atTokenAt(text: string, cursorOffset: number): AtToken | undefined {
  const cursor = Math.max(0, Math.min(text.length, cursorOffset));
  for (let i = cursor - 1; i >= 0; i--) {
    const char = text[i]!;
    if (/\s/.test(char)) return undefined;
    if (char === "@") {
      if (i > 0 && !/\s/.test(text[i - 1]!)) return undefined;
      return { start: i, fragment: text.slice(i + 1, cursor) };
    }
  }
  return undefined;
}

export interface FileCandidate {
  /** Path to insert after `@`, relative to cwd (e.g. `packages/ko-tui/`). */
  path: string;
  /** Entry name for display filtering/ranking. */
  name: string;
  isDirectory: boolean;
}

const NOISE_DIRS = new Set(["node_modules", ".git", "dist"]);
const DEFAULT_LIMIT = 50;

/**
 * List one directory level of candidates for the fragment typed after `@`.
 * Fragments escaping the cwd (absolute paths, `..` beyond root) yield [].
 */
export function listFileCandidates(cwd: string, fragment: string, limit = DEFAULT_LIMIT): FileCandidate[] {
  const slashIndex = fragment.lastIndexOf("/");
  const dirPart = slashIndex >= 0 ? fragment.slice(0, slashIndex + 1) : "";
  const namePart = slashIndex >= 0 ? fragment.slice(slashIndex + 1) : fragment;

  const baseCwd = resolve(cwd);
  const target = resolve(baseCwd, dirPart);
  if (target !== baseCwd && !target.startsWith(baseCwd + sep)) return [];

  let entries;
  try {
    entries = readdirSync(target, { withFileTypes: true });
  } catch {
    return [];
  }

  const query = namePart.toLowerCase();
  const showDotfiles = namePart.startsWith(".");

  const matched = entries.filter((entry) => {
    if (NOISE_DIRS.has(entry.name)) return false;
    if (entry.name.startsWith(".") && !showDotfiles) return false;
    return query === "" || entry.name.toLowerCase().includes(query);
  });

  const tier = (name: string): number => (query === "" || name.toLowerCase().startsWith(query) ? 0 : 1);
  matched.sort((a, b) => {
    const tierDiff = tier(a.name) - tier(b.name);
    if (tierDiff !== 0) return tierDiff;
    const dirDiff = Number(b.isDirectory()) - Number(a.isDirectory());
    if (dirDiff !== 0) return dirDiff;
    return a.name.localeCompare(b.name);
  });

  return matched.slice(0, limit).map((entry) => ({
    path: entry.isDirectory() ? `${dirPart}${entry.name}/` : `${dirPart}${entry.name}`,
    name: entry.name,
    isDirectory: entry.isDirectory(),
  }));
}

export interface AppliedCandidate {
  text: string;
  cursorOffset: number;
  /** True when a directory was inserted and the picker should stay open. */
  keepOpen: boolean;
}

export interface FilePickerState {
  tokenStart: number;
  fragment: string;
  candidates: FileCandidate[];
  selectedIndex: number;
}

/**
 * Derive the picker state from the input buffer. Returns `prev` unchanged when
 * the token is identical (selection survives navigation keys), a fresh state
 * when the fragment changed, and null when no `@` token owns the cursor or
 * slash mode is active.
 */
export function deriveFilePickerState(
  prev: FilePickerState | null,
  text: string,
  cursorOffset: number,
  slashActive: boolean,
  list: (fragment: string) => FileCandidate[],
): FilePickerState | null {
  if (slashActive) return null;
  const token = atTokenAt(text, cursorOffset);
  if (!token) return null;
  if (prev && prev.fragment === token.fragment && prev.tokenStart === token.start) return prev;
  return {
    tokenStart: token.start,
    fragment: token.fragment,
    candidates: list(token.fragment),
    selectedIndex: 0,
  };
}

export type FilePickerKeyAction = "previous" | "next" | "insert" | "dismiss" | "none";

export interface FilePickerKeyInfo {
  upArrow?: boolean;
  downArrow?: boolean;
  tab?: boolean;
  return?: boolean;
  escape?: boolean;
  shift?: boolean;
}

/** Keys the picker owns while open; everything else falls through to editing. */
export function filePickerKeyAction(input: string, key: FilePickerKeyInfo): FilePickerKeyAction {
  if (key.escape || isBareEscapeInput(input)) return "dismiss";
  if (key.upArrow || (key.tab && key.shift)) return "previous";
  if (key.downArrow) return "next";
  if (key.tab || key.return || input === "\r" || input === "\n") return "insert";
  return "none";
}

/**
 * Replace the fragment (from after `@` to cursor) with the candidate path.
 * Files append one space and close the picker; directories end with `/` and
 * keep it open for descent.
 */
export function applyCandidate(
  text: string,
  cursorOffset: number,
  tokenStart: number,
  candidate: FileCandidate,
): AppliedCandidate {
  const insert = candidate.isDirectory ? candidate.path : `${candidate.path} `;
  const nextText = text.slice(0, tokenStart + 1) + insert + text.slice(cursorOffset);
  return {
    text: nextText,
    cursorOffset: tokenStart + 1 + insert.length,
    keepOpen: candidate.isDirectory,
  };
}
