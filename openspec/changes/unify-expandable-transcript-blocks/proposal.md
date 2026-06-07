## Why

`ctrl+o` expansion is currently tool-card-specific and does not match the reference interaction where any collapsed transcript block, including thinking and tool output, can be focused and expanded in place. Thinking blocks still use an unconnected Enter-based local toggle, so the displayed transcript cannot be consistently inspected with one shortcut.

## What Changes

- Introduce a unified expandable transcript block model for assistant turn items that can collapse, focus, and expand.
- Include thinking blocks and tool cards in the same keyboard navigation sequence.
- Make Ctrl+O expand/collapse the currently focused expandable transcript block, not only the selected tool card.
- Keep Up/Down/Tab navigation and Escape-to-input behavior for the expandable-block focus mode.
- Remove or replace Enter-based thinking expansion behavior so hints and keyboard handling are consistent.
- Preserve chronological turn rendering from `fix-tool-output-order-and-ctrl-o`.

## Capabilities

### New Capabilities

- `tui-expandable-transcript-blocks`: unified focus and expansion behavior for collapsible assistant transcript blocks such as thinking blocks and tool cards.

### Modified Capabilities

- `tui-turn-based-conversation`: thinking and tool items in ordered turns must expose stable expandable block keys and render focused/expanded state from parent TUI state.
- `tui-tool-output-navigation`: tool output navigation must participate in generic expandable block navigation while preserving tool-card focus and expansion behavior.
- `tui-focus-routing`: keyboard focus routing must support an expandable transcript block focus mode for Ctrl+O, Up/Down/Tab, and Escape.

## Impact

- Affects `packages/ko-tui/src/types.ts`, `useTurns.ts`, `Turn.tsx`, `Conversation.tsx`, `ThinkingBlock.tsx`, `ToolCallCard.tsx`, `App.tsx`, and `focus.ts`.
- Affects focused TUI tests for turn item keys, block navigation, thinking expansion, and Ctrl+O behavior.
- May require generated CLI bundle refresh in `packages/ko-cli/bin/kocode.mjs` after implementation.
- Does not change provider streaming, agent execution, persisted session message format, or tool permission semantics.
