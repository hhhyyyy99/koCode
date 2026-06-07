## Why

The current TUI input delegates cursor state to `ink-text-input`, while slash command completion, history restore, external editor return, and future file completion update the input value from outside the component. This causes command completion to leave the internal cursor at the old offset, so follow-up typing can insert text inside the completed command instead of at the end.

The TUI now has enough editor-like behavior that input text and cursor position need to be controlled as one explicit buffer, not split between application state and a hidden third-party component state.

## What Changes

- Replace the hidden cursor state dependency in the TUI input with a controlled input buffer containing text and cursor offset.
- Route user editing, multiline insertion, deletion, cursor movement, history restore, external editor return, slash command fill, and completion through explicit input-buffer operations.
- Ensure programmatic input updates can place the cursor deterministically, especially at the end of completed slash commands and after inserted newlines.
- Preserve the existing separator-frame input layout, prompt symbol, placeholder, prefix routing, history search, running draft behavior, and command panel placement.
- Add regression coverage for command completion followed by additional typing, multiline insertion at cursor, and restored/programmatic input cursor placement.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tui-enhanced-input`: Input requirements change to require a controlled text-and-cursor buffer for user and programmatic edits, including deterministic cursor placement after multiline insertion and restored text.
- `tui-command-panel`: Command completion and command selection requirements change to require completed or filled commands to place the cursor at the intended edit position before accepting more typing.
- `tui-input-history`: History restore requirements change to require restored entries to place the cursor at the end of the restored input.

## Impact

- Affected package: `packages/ko-tui`.
- Primary files: `App.tsx`, `InputBox.tsx`, command-panel keyboard handling, input history integration, and related tests.
- Dependency impact: removes or isolates reliance on `ink-text-input` for cursor behavior; no new runtime dependency is expected.
- Behavioral impact: fixes slash completion cursor corruption and establishes the same cursor contract for future `@` file completion.
