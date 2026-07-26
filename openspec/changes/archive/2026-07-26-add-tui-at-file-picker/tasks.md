## 1. Pure helpers (file-picker.ts)

- [x] 1.1 Implement `atTokenAt(text, cursorOffset)` returning `{ start, fragment }` for the `@` token containing the cursor (start-of-input or whitespace-preceded), else `undefined`.
- [x] 1.2 Implement `listFileCandidates(cwd, fragment, limit?)` with dir/name split, readdir one level, noise filter (`node_modules`, `.git`, `dist`), dotfile rule, directory-first prefix-then-contains ranking, and `[]` on ENOENT/EACCES/escape-of-cwd.
- [x] 1.3 Implement `applyCandidate(text, cursorOffset, tokenStart, candidate)` returning next `{ text, cursorOffset, keepOpen }` (file → path + trailing space + close; directory → path + `/` + stay open).
- [x] 1.4 Unit tests for 1.1–1.3 covering: mid-sentence token, empty fragment, `dir/sub` fragments, `..`/absolute escape → `[]`, dotfile visibility, ranking order, directory descent insertion.

## 2. Focus routing

- [x] 2.1 Add `"file-picker"` to `FocusMode`; `isTextInputFocus` true, `isModalFocus` false, `canUseGlobalShortcut` false.
- [x] 2.2 Map `file-picker` → `input` in `restoreFocusAfterBlockingMode`.
- [x] 2.3 Keep `bareEscapeAction` returning `"ignore"` for `file-picker` (Esc handled by picker branch before reaching input rules).
- [x] 2.4 Update `focus.test.ts` for the new mode's classification and restoration.

## 3. Panel component

- [x] 3.1 Add `FilePickerPanel` rendering candidate rows (dir marker `/`, selected `❯`, CommandPanel-style 6-row sliding window with above/below counters).
- [x] 3.2 Empty-candidate state renders "No matching files".
- [x] 3.3 Component-level tests for row formatting, window slicing, and empty state.

## 4. App integration

- [x] 4.1 Derive picker state in `App` from input buffer changes: token present → open `file-picker` focus + compute candidates; token gone → close and restore `input`.
- [x] 4.2 Route keys while `file-picker` active: Up/Down move selection, Tab/Enter apply highlighted candidate via `applyCandidate` (Enter never submits), Esc closes keeping text.
- [x] 4.3 Ensure slash mode and file picker are mutually exclusive; permission request interrupt restores to `input`; running=true keeps draft edits working.
- [x] 4.4 Render `FilePickerPanel` below the input (same slot pattern as CommandPanel) only while active.
- [x] 4.5 Integration-style tests in `InputBox`/`App` seams for open→filter→descend→insert→submit-route-unchanged and Esc-keeps-text.

## 5. Verification

- [x] 5.1 Run `pnpm --filter @kocode/ko-tui test`.
- [x] 5.2 Run `pnpm typecheck && pnpm test`.
- [x] 5.3 Run `openspec validate --all --strict`.
- [x] 5.4 Run `pnpm bundle` and PTY-smoke the bundled CLI: type `@`, see candidates, descend a directory, insert a file, Esc dismiss, submit unchanged `@path` route.
