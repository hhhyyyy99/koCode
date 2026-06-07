## 1. Ordered Turn Rendering

- [x] 1.1 Update `packages/ko-tui/src/types.ts` to represent assistant output as ordered render items for text, thinking, and tool cards while preserving stable tool keys.
- [x] 1.2 Update `packages/ko-tui/src/useTurns.ts` so `message_delta`, `thinking_delta`, `tool_start`, and `tool_end` append or update ordered items without losing duplicate tool-start handling or reused completed tool id handling.
- [x] 1.3 Update `packages/ko-tui/src/Turn.tsx` to render assistant items in order and keep the completion marker below the final rendered assistant item.
- [x] 1.4 Update `packages/ko-tui/src/Conversation.tsx` to derive tool navigation keys from ordered tool items.
- [x] 1.5 Update session-resume event reconstruction where practical so restored assistant text/tool calls/tool results do not produce misleading ordering.

## 2. Ctrl+O Tool Expansion

- [x] 2.1 Update `packages/ko-tui/src/App.tsx` to recognize Ctrl+O from Ink as `key.ctrl && input === "o"` while retaining compatibility with the raw control character.
- [x] 2.2 Change Ctrl+O behavior so a single keypress enters tool-output focus when needed and toggles the focused tool card in the same action.
- [x] 2.3 Keep existing Up/Down/Tab/Escape tool-output navigation behavior working after the shortcut change.
- [x] 2.4 Ensure tool-card visible hints and any comments/tests consistently describe Ctrl+O as the expand/collapse shortcut.

## 3. Tests

- [x] 3.1 Add `useTurns` coverage for text-tool-text chronology within one turn.
- [x] 3.2 Add `useTurns` coverage proving repeated running `tool_start` events are still deduplicated with ordered items.
- [x] 3.3 Add `useTurns` coverage proving reused completed provider tool ids still create distinct tool cards with stable keys.
- [x] 3.4 Add App-level or extracted-handler tests for Ctrl+O input shapes, including Ink's `input === "o"` with `key.ctrl = true`.
- [x] 3.5 Add tests proving the first Ctrl+O keypress toggles the selected/focused tool instead of only entering tool-output mode.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @kocode/ko-tui test`.
- [x] 4.2 Run `pnpm typecheck`.
- [x] 4.3 Run `pnpm test`.
- [x] 4.4 Run `openspec validate --all --strict`.
