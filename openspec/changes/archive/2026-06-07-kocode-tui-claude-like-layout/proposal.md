## Why

The current TUI already has the right building blocks, but the startup, input, and slash-command areas do not yet read like the Claude Code terminal layout the project is targeting. This change tightens the information hierarchy and terminal frame without copying the ignored logo/icon artwork.

## What Changes

- Rework the startup/header presentation so the first viewport emphasizes version, model, billing/context details where available, and current working directory in a compact Claude-like stack.
- Replace fixed-width separators with terminal-width horizontal rules around the input area.
- Make the slash-command panel render as an unbordered completion list below the input separator instead of a rounded box.
- Keep the slash-command panel directly adjacent to the input separator rather than separated by the status bar.
- Align command rows into stable columns: selected marker, command name, description, and optional source/scope metadata.
- Remove the requirement that the welcome/header layout must include ASCII logo artwork or a separate getting-started tips block for this layout mode.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tui-header`: Header/welcome requirements change from logo-led branding to compact Claude-like version/model/cwd hierarchy with icons ignored.
- `tui-welcome-screen`: Welcome empty-state requirements change so startup identity is owned by the compact header; ASCII logo and tips are no longer required in the body.
- `tui-enhanced-input`: Input layout requirements change to a full-width separator/input/separator frame using the existing `❯` prompt.
- `tui-command-panel`: Slash panel requirements change from bordered panel presentation to an unbordered Claude-like completion list with aligned rows and source metadata support.

## Impact

- Affected package: `packages/ko-tui`.
- Likely affected files: `App.tsx`, `Header.tsx`, `Welcome.tsx`, `InputBox.tsx`, `CommandPanel.tsx`, related TUI tests.
- No new runtime dependency is expected.
- No agent/provider API changes are expected.
