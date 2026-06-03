## Why

The current koCode TUI has accumulated many Claude Code alignment features, but the core interactive loop remains unreliable: input can disappear while the agent runs, keyboard focus is implicit, tool expansion hints do not match behavior, and permission dialogs compete with other input handlers. This change isolates the interaction integrity work so the TUI becomes predictable before adding more visual or feature parity.

## What Changes

- Keep the input surface stable during agent execution, preserving user drafts and allowing the next prompt to be prepared while a turn is running.
- Introduce an explicit focus routing model for input, slash commands, modals, permission dialogs, tool output navigation, and global shortcuts.
- Make tool output navigation real: visible focus, matching key hints, deterministic expand/collapse behavior, and usable output summaries.
- Treat permission requests as blocking modal interactions with clear ownership of keyboard input and reliable state restoration after approval or denial.
- Add a real TTY acceptance checklist/harness for the critical loop: input -> running turn -> tool call -> permission -> tool expansion -> turn completion -> next input.
- De-scope broad Claude Code feature parity from this change. Theme polish, MCP UI, full session branching, and visual parity work remain in `kocode-tui-full-alignment` or later changes.

## Capabilities

### New Capabilities
- `tui-input-continuity`: Input remains available and draft-safe across idle, running, modal, and completed turn states.
- `tui-focus-routing`: Keyboard events are routed through an explicit focus mode so slash panels, modals, permissions, tool focus, and global shortcuts do not conflict.
- `tui-tool-output-navigation`: Tool cards expose usable focus, expansion, collapse, and output-summary behavior with accurate key hints.
- `tui-permission-modal-flow`: Permission prompts behave as modal gates that pause risky actions, own keyboard input, and restore the previous interaction state after resolution.
- `tui-tty-acceptance`: Real TTY validation is required for the core interaction loop and for future TUI alignment acceptance.

### Modified Capabilities

## Impact

- Affected packages: `packages/ko-tui` primarily; `packages/ko-agent` only if permission or running-state events need small contract adjustments.
- Likely affected files: `packages/ko-tui/src/App.tsx`, `InputBox.tsx`, `ToolCallCard.tsx`, `Turn.tsx`, `PermissionDialog.tsx`, `StatusBar.tsx`, `CommandPanel.tsx`, and focused tests around input/focus behavior.
- No new runtime dependencies are expected.
- This change may adjust keyboard behavior, but should not change provider APIs, model selection, tool execution semantics, or the existing event stream shape unless a small missing event is required for correctness.
