## Why

Slash command completion currently disagrees with the command panel selection: the UI can highlight one command while Tab completes the first filtered command. Command filtering also treats command descriptions as equal to command names and preserves registry order, so typing `/exit` can rank `/quit` before the exact `/exit` command.

## What Changes

- Make Tab completion use the currently highlighted slash command instead of always using the first filtered command.
- Rank slash command filter results by relevance so command-name matches outrank description-only matches.
- Normalize slash command query text consistently for ranking, including leading `/` and incidental trailing whitespace after completion.
- Add regression coverage for selected-command Tab completion and `/exit` ranking above `/quit`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tui-command-panel`: Clarify that Tab completion targets the highlighted command and that command-name matches rank ahead of description-only matches.

## Impact

- Affected code: `packages/ko-tui/src/App.tsx`, `packages/ko-tui/src/commands.ts`, and focused TUI tests.
- Affected specs: `openspec/specs/tui-command-panel/spec.md`.
- APIs/dependencies: No public API or dependency changes expected.
