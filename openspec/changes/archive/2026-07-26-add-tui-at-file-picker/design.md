# Design: `@` interactive file picker

## Context

`@path` today is submit-time only: `parseInputRoute` recognizes a leading `@` and builds a `Referenced file:` prompt. The deferred half is discovery: an interactive panel that completes real paths while typing. The slash command panel already solves the same interaction shape (panel below input, Up/Down/Tab/Enter/Esc, sliding window), so the picker follows that pattern rather than inventing a new one.

## Goals / Non-Goals

Goals:

- Complete file/directory paths from the session cwd as the user types after `@`.
- Work at any word position in the input (`fix @src/foo.ts please`), not only input start.
- Keep the existing input-start `@path` submit route byte-for-byte unchanged.
- Own keys via a dedicated focus mode; never fight slash mode or modals.

Non-Goals:

- No fuzzy-match engine (subsequence scoring); prefix/contains ranking is enough for v1.
- No file content preview, no multi-select, no `@`-mention structured attachments to the agent seam — the picker only edits input text.
- No recursive workspace indexing or watchers; each keystroke lists one directory level via readdir.
- No gitignore parsing; only a fixed noise filter (`node_modules`, `.git`, `dist`) plus dotfile handling.

## Decisions

### 1. Token detection: cursor-based, any word position

The picker triggers when the token containing the cursor starts with `@` and the char before `@` is input start or whitespace. Implemented as a pure function `atTokenAt(text, cursorOffset)` returning `{ start, fragment }` or `undefined` (fragment = text between `@` and cursor). Pure function → unit-testable without Ink.

Why not input-start only like `/`: `@` mentions mid-sentence are the primary Claude Code usage (`look at @src/a.ts and fix`), and the submit route only cares about input-start `@` — the two concerns are independent.

Edge rule: fragment containing whitespace is impossible (token ends at whitespace); `@` immediately followed by cursor (empty fragment) lists the cwd root — same as Claude Code.

### 2. Candidate listing: one readdir level per fragment

`listFileCandidates(cwd, fragment, limit)`:

- Split fragment into `dirPart` (up to last `/`) and `namePart` (after it).
- `readdirSync` on `resolve(cwd, dirPart)` with `withFileTypes`; on ENOENT/ENOTDIR/EACCES return `[]` (picker shows "no matches", never throws).
- Rank: name-prefix matches first, then contains; case-insensitive; directories before files inside each tier; alphabetical within tier.
- Filter: skip `node_modules`, `.git`, `dist` at any level; skip dotfiles unless `namePart` itself starts with `.`.
- Path safety: candidates outside the cwd are impossible by construction (relative resolve from cwd); absolute fragments (`@/etc`) and `..` segments that escape the cwd yield `[]` — sandbox thinking per workflow rules. `~` is not expanded.
- Cap at `limit` (default 50) before ranking display; panel windows to 6 rows like CommandPanel.

Sync readdir is acceptable: one directory level, called per keystroke on the render path Ink already batches; the slash filter is sync too. If it ever measures slow we can debounce, not v1.

### 3. Insertion semantics

Selecting a candidate replaces the fragment (text from after `@` to cursor) with the candidate path:

- File: insert `dirPart + name`, then one trailing space, cursor after the space, picker closes.
- Directory: insert `dirPart + name + "/"`, no space, cursor after `/`, picker stays open now listing that directory — enables keyboard descent (`@src/` → pick `components/` → keep going).

Tab and Enter behave identically while the picker is open (both insert; Enter must NOT submit — key priority below). Esc closes the picker and keeps typed text as-is; a later bare Esc follows existing input rules.

### 4. Focus mode `file-picker`

New `FocusMode` value `"file-picker"`:

- `isTextInputFocus("file-picker")` → true (typing continues to edit the buffer, same as `slash`).
- `isModalFocus` → false; `canUseGlobalShortcut` → false.
- Esc priority slots between blocking modals and slash: modal → **file-picker** → slash → history-search → running-cancel → bare/double-Esc. Rationale: picker is the innermost transient popup; slash cannot be open simultaneously (a token starting `@` is never a leading `/` route, and slash mode only activates on input-start `/`).
- While active, App-level `useInput` owns Up/Down/Tab/Enter/Esc exactly like the slash branch; all other keys fall through to InputBox editing, and every buffer change re-evaluates `atTokenAt` — token gone (space typed, `@` deleted, cursor left the token) → picker closes, focus returns to `input`.
- Permission request arriving while picker open: permission wins (existing previousFocus mechanism restores `input`, not `file-picker` — restoreFocusAfterBlockingMode maps non-modal previous to itself; we add `file-picker` → `input` there since the token may be stale after the interruption).
- running=true: picker still works — it only edits the draft, which is explicitly preserved during runs.

### 5. Submit interaction

If the user presses Enter while the picker is open, it inserts (never submits). After the picker closes (file inserted + space), the next Enter submits through the unchanged route: input-start `@` goes `file_reference`, otherwise plain `prompt` containing `@path` text inline. No change to `parseInputRoute`.

## Risks / Trade-offs

- **readdir per keystroke**: bounded by one directory level; mitigated by the 50-candidate cap. Accepted for v1 simplicity.
- **Insertion vs IME/wide chars**: insertion reuses `insertText`/`setInputText` buffer primitives, which are already grapheme-safe in tests.
- **Focus interplay regressions**: mitigated by pure-function key routing (`filePickerKeyAction`) plus focused tests mirroring `focus.test.ts` patterns.
- **Windows path separators**: candidates are built with `/` joins (project convention for display text); `resolve` handles platform separators on read. Accepted: TUI targets POSIX-style display.

## Migration Plan

Pure addition behind new focus mode; no data, config, or session format changes. Rollback = revert the change.

## Open Questions

None blocking. Future: gitignore-aware filtering, fuzzy scoring, recent-files ranking.
