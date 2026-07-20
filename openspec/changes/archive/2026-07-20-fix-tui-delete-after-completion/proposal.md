## Why

The controlled TUI input buffer fixed command-completion cursor placement, but it changed delete-key semantics: terminals commonly report Backspace as `key.delete`, and the new input code treats that as forward-delete. When the cursor is at the end of completed or typed text, deletion becomes a no-op.

This blocks normal editing immediately after slash completion and can leave the command panel stuck while the user tries to erase or revise input.

## What Changes

- Restore terminal Backspace behavior for the controlled input buffer by treating the delete/backspace key path as backward deletion in normal text-entry contexts.
- Ensure deletion after slash command completion removes characters from the end of the completed command.
- Ensure slash mode updates or closes when deletion changes the input text away from a slash command prefix.
- Add regression coverage for deleting after completion, deleting ordinary typed characters, and deleting slash input down to empty.
- Preserve forward-delete support only where the terminal input layer can distinguish it reliably.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tui-enhanced-input`: Input deletion requirements change to require terminal Backspace/delete-key events to remove the character before the cursor in normal text-entry contexts.
- `tui-command-panel`: Command panel requirements change so deleting completed slash input updates filtering and closes the panel when the input no longer starts with `/`.

## Impact

- Affected package: `packages/ko-tui`.
- Primary files: `InputBox.tsx`, `input-buffer.ts` usage/tests, `App.tsx` slash-mode routing if deletion state needs additional synchronization, and related tests.
- Behavioral impact: users can delete characters after command completion and ordinary typing again; slash panel filtering remains consistent while deleting.
- Dependency impact: no new dependency expected.
