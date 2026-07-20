## Context

The previous change introduced ordered assistant turn items and a tool-specific Ctrl+O toggle. That fixed text/tool ordering and the basic tool-card shortcut, but it still treats only tool calls as navigable expandable output. Thinking blocks are rendered through `ThinkingBlock` with local Enter-based state, and `Turn.tsx` currently passes `focused={false}`, so thinking cannot participate in the same keyboard workflow.

The reference interaction shows a broader model: any collapsed transcript block, such as a thinking block or tool output, can be focused and expanded with Ctrl+O. koCode needs the same block-level interaction instead of a tool-only list.

## Goals / Non-Goals

**Goals:**

- Treat thinking blocks and tool cards as expandable transcript blocks in one visual/navigation sequence.
- Use Ctrl+O as the only documented expand/collapse shortcut for these transcript blocks.
- Keep block navigation deterministic with visible focus, Up/Down/Tab movement, and Escape returning to input.
- Preserve chronological turn rendering and stable keys introduced by `fix-tool-output-order-and-ctrl-o`.
- Keep expansion state controlled by the parent TUI state so completed and active turns behave consistently.

**Non-Goals:**

- Add expansion for normal assistant text or user messages.
- Change provider streaming, agent execution, permission handling, or persisted message schema.
- Redesign the visual style of tool cards beyond focus/expand coordination.
- Add mouse interaction or terminal scroll management.

## Decisions

### Derive expandable block keys from ordered assistant items

Each ordered assistant item that can expand SHALL expose one stable expandable key. Tool items can keep their existing tool call key. Thinking items should use their ordered item key. The conversation-level key list should be derived from visual order:

```text
turn.assistant.items
  ├─ text       not expandable
  ├─ thinking   expandable key 0:1:thinking
  ├─ tool       expandable key 0:0:tool-call_0
  ├─ text       not expandable
  └─ tool       expandable key 0:1:tool-call_1
```

Navigation then follows the same top-to-bottom order users see on screen.

Alternative considered: keep a separate `toolKeys` list and add `thinkingKeys`. That would duplicate ordering logic and still leave Ctrl+O behavior split across block types.

### Parent controls focus and expansion

`App` should own:

- `expandableBlockKeys`
- `selectedBlockIndex`
- `expandedBlockIds`
- an expandable-block focus mode

`Conversation` derives the key list and reports it upward. `Turn` receives `focusedBlockKey` and `expandedBlockIds`, then passes `focused` and `expanded` into `ThinkingBlock` and `ToolCallCard`.

`ThinkingBlock` should become a controlled display component. It should not call `useInput` or maintain private expansion state because that bypasses the global focus router.

### Ctrl+O toggles the focused expandable block

When expandable blocks exist, Ctrl+O should:

- enter expandable-block focus mode if needed
- select a deterministic block key
- toggle that block in the same keypress

When already in expandable-block focus mode, Ctrl+O toggles the currently selected block. Up/Down/Tab move between expandable blocks. Escape returns focus to input.

The exact internal focus mode name can be `transcript-block` or an equivalent semantic replacement for `tool-output`. The implementation should avoid keeping user-visible behavior tied to a tool-only concept.

### Hints match behavior

Thinking and tool blocks should show hints that match the current shortcut:

- collapsed: `ctrl+o to expand`
- expanded: `ctrl+o to collapse`

Hints should be visible when the block is collapsible and especially when output is truncated or summarized. Enter-based expansion language should not appear for thinking/tool transcript blocks.

## Risks / Trade-offs

- More block types share one focus model -> Mitigate with pure focus helper tests and rendering tests for mixed thinking/tool sequences.
- Completed turns may contain focusable blocks -> Mitigate by keeping expansion state in App and passing it through completed and active turns.
- Existing `tool-output` tests may assume tool-only behavior -> Mitigate by updating terminology and retaining tool-card behavior as a subset of expandable block behavior.
- Hint density can clutter short blocks -> Mitigate by showing compact hint text and preserving summaries for collapsed blocks.
