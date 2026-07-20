## Context

The TUI currently reduces a turn into separate assistant buckets: `textContent`, `thinkingBlocks`, and `toolCalls`. `Turn.tsx` then renders the entire text bucket separately from the tool bucket. This loses the chronological relationship between the text that precedes a tool call, the tool card/result, and any later assistant text from the next model loop.

Tool output expansion also has inconsistent behavior. Tool cards display `ctrl+o` hints, but the App-level shortcut checks for a control character while Ink exposes Ctrl+letter input as the letter name with `key.ctrl = true`. The first matching keypress currently enters tool-output focus without toggling, which makes the visible hint misleading.

## Goals / Non-Goals

**Goals:**

- Preserve chronological assistant content order inside a turn while keeping one user message per turn.
- Keep tool cards navigable and expandable using the existing tool-output focus model.
- Make `ctrl+o` match the visible expand/collapse hint and Ink's input behavior.
- Add focused tests for event ordering and shortcut behavior.

**Non-Goals:**

- Change provider streaming protocols or agent tool execution semantics.
- Change persisted session message format.
- Redesign tool permission dialogs, slash commands, or status panels.
- Introduce new keyboard shortcuts beyond aligning `ctrl+o`.

## Decisions

### Represent assistant turn output as ordered items

Use an ordered assistant item list as the TUI rendering model. Each item represents one displayed block:

- text block
- thinking block
- tool call card

`processEvent` should append or update this ordered list as events arrive. A `message_delta` appends to the latest text item only when that item is already the last compatible text block; if a tool item or thinking item appeared after the prior text, it creates a new text item. `thinking_delta` follows the same pattern for thinking blocks. `tool_start` appends a tool item, and `tool_end` updates the latest matching running tool item.

This keeps the real timeline:

```text
text: "I'll inspect..."
tool: Ls(...)
tool: Read(...)
text: "Based on those files..."
```

instead of collapsing it into:

```text
text: "I'll inspect... Based on those files..."
tool: Ls(...)
tool: Read(...)
```

Alternative considered: render all tool cards before all text. That would match one existing spec sentence, but still fails when a turn legitimately contains text before a tool call and text after the tool result.

### Keep tool keys stable and derive navigation from ordered items

Tool focus keys should remain stable and continue to include turn id, tool ordinal, and provider tool call id. The tool key list used by `Conversation` and `App` can be derived by scanning ordered items for tool entries.

Existing duplicate handling remains necessary:

- repeated `tool_start` for the same running tool updates the current running item
- reused completed provider ids create a new tool item with a unique TUI key
- `tool_end` targets the latest matching running tool, falling back to the latest matching tool item

### Make Ctrl+O a direct toggle for the focused tool

Shortcut handling should accept Ink's Ctrl+letter shape (`key.ctrl && input === "o"`) and may retain compatibility with the raw control character. When tool cards exist, Ctrl+O should enter tool-output focus if needed and toggle the focused tool in the same keypress.

The focused tool should be deterministic. A conservative default is the current selected tool when already in tool-output mode; when entering tool-output mode, select a stable target such as the current selected index clamped to available keys, preferably the most recent tool with expandable/truncated output if no prior selection exists.

Alternative considered: require one Ctrl+O to focus and another Ctrl+O to toggle. This preserves the current state transition but contradicts the displayed `ctrl+o to expand` hint.

### Align specs and visible hints

Tool-card hints and specs should consistently document `ctrl+o` as the expand/collapse shortcut. Enter-based expansion language should be removed or updated where it conflicts with `ctrl+o`.

## Risks / Trade-offs

- Ordered items touch shared TUI state and rendering paths -> Mitigate with focused `useTurns` tests for text-tool-text ordering, repeated tool starts, and reused tool ids.
- Shortcut behavior can conflict with input editing expectations -> Mitigate by keeping Ctrl+O as an App-level global shortcut only when tool cards exist and preserving Escape to return to input focus.
- History resume may still be limited by existing message-to-event reconstruction -> Mitigate by reconstructing assistant text/tool-call/tool-result order from persisted messages where practical without changing the stored message schema.
- Completed turns rendered in Static may not update after completion -> Mitigate by ensuring expansion state is determined before Static rendering or preserving the existing interactive active-turn behavior for tool-output navigation as currently supported.
