## Why

Tool call output currently appears visually detached from the assistant text that caused it because the TUI groups all assistant text ahead of tool cards instead of preserving the event timeline. The displayed `ctrl+o` expand/collapse hint is also unreliable because the shortcut handling does not match Ink's Ctrl+letter input shape and the first keypress only enters tool-output focus.

## What Changes

- Render assistant turn content in the same observable order as the event stream: thinking, text, tool starts/results, and later text should appear in chronological sequence within the turn.
- Keep tool cards grouped under the same user turn, but stop hoisting all assistant text above all tool cards.
- Make `ctrl+o` reliably expand and collapse the focused tool card, including Ink's Ctrl+letter input format.
- Align visible tool-card hints, shortcut handling, and tests around `ctrl+o` rather than a mixture of Enter and `ctrl+o`.
- Preserve existing focused tool-output navigation with Up/Down/Tab/Escape.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tui-turn-based-conversation`: assistant text and tool cards within a turn must preserve chronological event order instead of being rendered as separate grouped buckets.
- `tui-tool-output-navigation`: `ctrl+o` must directly toggle the focused tool card according to the displayed hint.
- `tui-tool-card-realignment`: tool-card expansion hints and documented toggle behavior must consistently reference `ctrl+o`.

## Impact

- Affects TUI turn state construction and rendering in `packages/ko-tui/src/useTurns.ts`, `Turn.tsx`, `Conversation.tsx`, and related types.
- Affects keyboard handling in `packages/ko-tui/src/App.tsx` and focus behavior for tool-output mode.
- Affects tool-card tests and turn-rendering tests, especially chronological ordering and expand/collapse shortcut coverage.
- No provider, agent execution, session storage format, or CLI command behavior is expected to change.
