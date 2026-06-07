## 1. Input Buffer Helpers

- [x] 1.1 Add a typed `InputBuffer` model with `text` and `cursorOffset` fields in the TUI input area.
- [x] 1.2 Implement pure input-buffer helper operations for setting text, inserting text, deleting backward/forward, moving the cursor, replacing ranges, and clamping cursor offsets.
- [x] 1.3 Add unit tests for helper operations, including insertion at cursor, deletion bounds, cursor movement bounds, replacement cursor placement, and multi-character paste-like insertion.

## 2. Controlled Input Component

- [x] 2.1 Replace the `ink-text-input` usage in `InputBox.tsx` with a local controlled text input renderer that receives `InputBuffer` state.
- [x] 2.2 Render the focused cursor from controlled state, including cursor-at-end and placeholder states.
- [x] 2.3 Route printable input, Backspace/Delete, Left/Right, Enter, Alt+Enter, Ctrl+J, Escape, Ctrl+R, and Ctrl+G through explicit handlers without hidden third-party cursor state.
- [x] 2.4 Preserve the existing prompt symbol, separator-frame layout, placeholder text, running draft prompt, search UI, and focus gating.

## 3. App Integration

- [x] 3.1 Change `App.tsx` input state from a string message to an `InputBuffer` while preserving submit routing through `parseInputRoute`.
- [x] 3.2 Update slash mode filtering to derive from `input.text` and reset selection predictably when the filter changes.
- [x] 3.3 Update Tab command completion to set completed command text and place the cursor at the end.
- [x] 3.4 Update command selection for argument-taking commands to fill `"<command> "` and place the cursor after the trailing space.
- [x] 3.5 Update exact command execution, normal submit, shell prefix submit, memory prefix submit, and file-reference submit to clear the input buffer with cursor offset zero after successful handoff.

## 4. Programmatic Input Sources

- [x] 4.1 Update history restore so selected history entries populate the input buffer and place the cursor at the restored text end.
- [x] 4.2 Update external editor return so edited content populates the input buffer and places the cursor at the returned text end.
- [x] 4.3 Ensure explicit multiline shortcuts insert newlines at the current cursor offset and place the cursor after the inserted newline.
- [x] 4.4 Ensure Escape behavior for slash mode still closes the panel and clears the input buffer.

## 5. Regression Coverage

- [x] 5.1 Add a regression test for `/` plus Tab completion followed by printable input appending after the completed command.
- [x] 5.2 Add a regression test for argument command fill, such as `/model `, followed by argument typing at the trailing-space position.
- [x] 5.3 Add a regression test for history restore placing the cursor at the end before additional typing.
- [x] 5.4 Add a regression test for Alt+Enter and Ctrl+J inserting newlines at the current cursor position.
- [x] 5.5 Add or update focus/routing tests to ensure slash navigation keys and text-edit keys do not double-handle the same input event.

## 6. Verification

- [x] 6.1 Run `pnpm --filter @kocode/ko-tui test`.
- [x] 6.2 Run `pnpm --filter @kocode/ko-tui typecheck`.
- [x] 6.3 Perform a real TTY check for `/` Tab completion, `/model` argument fill, continued typing after completion, Escape close, history restore, and multiline insertion.
