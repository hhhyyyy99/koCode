## Why

The Claude Code IA alignment (archived `2026-07-20-align-tui-claude-code-ia`) shipped `@path` as a Tier-1 text route and explicitly deferred the interactive picker ("`@path` Tier-1 text route: MUST; picker deferred"). Today the user must type paths by hand with no discovery or validation; typos silently produce a `Referenced file:` prompt pointing at a nonexistent path. Claude Code's `@` mention opens a live file completion panel; koCode should reach parity for this daily-use surface.

## What Changes

- Add an interactive `@` file picker: when the token the cursor is in starts with `@`, a candidate panel opens below the input listing files/directories matching the typed fragment.
- Filter candidates as the user types, honoring the fragment after `@` (including `dir/sub` fragments); rank directory-prefix and name-prefix matches ahead of contains matches.
- Up/Down navigate candidates, Tab/Enter inserts the highlighted path into the input at the `@` token (directories insert with trailing `/` and keep the picker open for descent), Esc closes the picker keeping the typed text.
- Add a `file-picker` focus mode owning Up/Down/Tab/Enter/Esc while the panel is open, following the same routing contract as `slash`.
- Reuse the existing panel presentation (CommandPanel-style sliding window) for candidate rows.
- `@` picker activates from any word position in the input (unlike `/` which is input-start only); the existing input-start `@path` submit route is unchanged.

## Capabilities

### New Capabilities

- `tui-file-picker`: interactive `@` file completion panel — trigger, filtering, navigation, insertion, dismissal.

### Modified Capabilities

- `tui-input-prefix-system`: `@` file reference upgrades from Tier-1 text-only to interactive completion; submit routing behavior is unchanged.
- `tui-focus-routing`: add `file-picker` focus mode with Esc priority between blocking modals and slash.

## Impact

- Affected code: `packages/ko-tui/src/App.tsx`, `packages/ko-tui/src/InputBox.tsx`, `packages/ko-tui/src/focus.ts`, new `packages/ko-tui/src/file-picker.ts`, new `packages/ko-tui/src/FilePickerPanel.tsx`, TUI tests.
- Affected specs: new `tui-file-picker`; deltas to `tui-input-prefix-system`, `tui-focus-routing`.
- APIs/dependencies: no new runtime dependencies; file listing uses `node:fs` readdir scoped to the session cwd. No ko-agent/ko-ai changes.
