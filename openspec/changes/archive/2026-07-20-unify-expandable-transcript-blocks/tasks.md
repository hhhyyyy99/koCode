## 1. Expandable Block Model

- [x] 1.1 Add typed expandable transcript block metadata for ordered assistant items in `packages/ko-tui/src/types.ts`.
- [x] 1.2 Add helpers to derive expandable block keys from thinking and tool items in visual order.
- [x] 1.3 Update `packages/ko-tui/src/useTurns.ts` as needed so thinking item keys remain stable and suitable for expansion.

## 2. Focus And Shortcut Routing

- [x] 2.1 Replace tool-only App state with expandable block state: keys, selected index, and expanded block ids.
- [x] 2.2 Update Ctrl+O handling so the first keypress enters expandable block focus and toggles the selected block.
- [x] 2.3 Update Up/Down/Tab navigation to move across all expandable transcript blocks.
- [x] 2.4 Update Escape handling to return from expandable block focus to input without altering drafts.
- [x] 2.5 Keep modal and permission focus modes blocking expandable block shortcuts.

## 3. Controlled Rendering

- [x] 3.1 Update `Conversation.tsx` to report expandable block keys instead of tool-only keys.
- [x] 3.2 Update `Turn.tsx` to pass focused and expanded state to thinking blocks and tool cards by block key.
- [x] 3.3 Refactor `ThinkingBlock.tsx` into a controlled display component without local `useInput` expansion state.
- [x] 3.4 Add Ctrl+O expand/collapse hints to collapsed and expanded thinking blocks.
- [x] 3.5 Preserve existing tool-card visual focus and expanded output behavior under the generic block model.

## 4. Tests

- [x] 4.1 Add unit tests for deriving expandable block keys from mixed text/thinking/tool ordered items.
- [x] 4.2 Add focus helper tests for Ctrl+O input, first-keypress toggle, navigation, and collapse across generic block keys.
- [x] 4.3 Add rendering tests for focused/expanded thinking blocks.
- [x] 4.4 Update existing tool-output tests to assert tool cards still expand/collapse through the generic block model.
- [x] 4.5 Add regression coverage that Enter is not required for thinking/tool expansion.

## 5. Verification

- [x] 5.1 Run `pnpm --filter @kocode/ko-tui test`.
- [x] 5.2 Run `pnpm typecheck`.
- [x] 5.3 Run `pnpm test`.
- [x] 5.4 Run `openspec validate --all --strict`.
- [x] 5.5 Run `pnpm bundle`.
