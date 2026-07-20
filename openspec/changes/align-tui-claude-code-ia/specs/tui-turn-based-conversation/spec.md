## MODIFIED Requirements

### Requirement: Conversation rendered as grouped turns

The TUI SHALL group conversation events into Turns, where each Turn contains one user message and the assistant's complete response. Within the assistant response, displayed thinking blocks, text blocks, and tool call cards SHALL preserve their **observable stream / arrival order** from display-producing events (not a fixed thinking-first layout).

#### Scenario: New turn starts on user message

- **WHEN** the TUI receives a `user_message` event
- **THEN** a new Turn is created and displayed with the user's message content

#### Scenario: Turn accumulates assistant response in stream order

- **WHEN** the TUI receives `message_start`, `message_delta`, `message_end`, `tool_start`, `tool_end`, `thinking_delta` events during a turn
- **THEN** all assistant content is grouped under the same Turn
- **AND** assistant content blocks render in the same relative order that display-producing events were processed

#### Scenario: Turn preserves text-tool-text chronology

- **WHEN** a turn receives assistant text deltas, then a tool start/end pair, then later assistant text deltas
- **THEN** the earlier assistant text renders above the tool card
- **AND** the later assistant text renders below the tool card

#### Scenario: Contiguous deltas merge

- **WHEN** multiple contiguous `message_delta` events arrive without an intervening different item kind
- **THEN** they merge into one growing text item
- **WHEN** multiple contiguous `thinking_delta` events arrive without an intervening different item kind
- **THEN** they merge into one thinking item

#### Scenario: Intervening kind opens a new item

- **WHEN** thinking content is interrupted by text or tool items and later thinking deltas arrive
- **THEN** a new thinking item is created rather than rewriting an earlier non-contiguous block

#### Scenario: Turn completes on turn_end

- **WHEN** the TUI receives a `turn_end` event
- **THEN** the current Turn is marked as complete and moved to the static completed area

### Requirement: Tool call cards with collapse

Each tool call SHALL be displayed as a card showing the tool name, with collapse/expand through the unified expandable transcript block model, and human-readable collapsed summaries per `tui-tool-card-realignment`.

#### Scenario: Tool card shows running state

- **WHEN** a `tool_start` event is received
- **THEN** a tool card appears showing the tool name and a running indicator

#### Scenario: Tool card shows result on completion

- **WHEN** a `tool_end` event is received
- **THEN** the tool card updates to `done` or `error` status and a collapsed summary (not a default full JSON dump)

#### Scenario: Tool card collapse toggle

- **WHEN** user presses Ctrl+O while a completed tool card is the focused expandable transcript block
- **THEN** the card toggles between expanded (full details) and collapsed (summary)

#### Scenario: Tool pairing stability

- **WHEN** `tool_start` / `tool_end` share the same tool call id
- **THEN** only one card exists for that running id
- **AND** a duplicate `tool_end` does not create a new UI item

### Requirement: Thinking blocks with collapse

Thinking content SHALL be displayed in secondary/dimmed style, grouped by thinking block, **collapsed by default**, and controlled by the unified expandable transcript block model shared with tools. Exact Claude thinking glyphs/headers are non-goals under fidelity A.

#### Scenario: Thinking block starts collapsed

- **WHEN** a `thinking_delta` event arrives for the current Turn
- **THEN** the thinking content is displayed in a collapsed block with dimmed/secondary text
- **AND** the block can be included in expandable transcript block navigation
- **AND** streaming does not auto-expand the block

#### Scenario: Thinking block expandable via Ctrl+O

- **WHEN** user presses Ctrl+O while the thinking block is the focused expandable transcript block
- **THEN** the thinking block expands to show full available content

#### Scenario: Thinking block collapse

- **WHEN** an expanded thinking block is focused and the user presses Ctrl+O
- **THEN** the thinking block returns to collapsed view

#### Scenario: Enter is not the thinking expand key

- **WHEN** progressive-alignment acceptance for thinking expansion is evaluated
- **THEN** Enter is not required (and MUST NOT be the sole documented expand key) for thinking blocks

### Requirement: Tool card rendering within turn

The system SHALL render tool cards with the human-readable summary contract defined in `tui-tool-card-realignment`, at the position where the tool call occurs in the turn's ordered assistant content.

#### Scenario: Tool card in active turn

- **WHEN** a turn has tool calls in any state (`running` / `done` / `error`)
- **THEN** each tool call renders as a card at its chronological stream position within assistant content
- **AND** cards follow the progressive-alignment summary contract (not glyph-clone pass criteria)

### Requirement: Thinking block rendering order

The system SHALL render thinking blocks in **stream / arrival order** among assistant items. The system MUST NOT require a fixed layout of “thinking always first, then tools, then text last.”

#### Scenario: Stream order with interleaved kinds

- **WHEN** a turn receives thinking, then tools, then text, or any other arrival order of those kinds
- **THEN** rendered assistant items follow that arrival order
- **AND** fixed thinking-first reordering is not applied

#### Scenario: Legacy fixed-order requirement superseded

- **WHEN** archived wording required thinking above tools above text regardless of event order
- **THEN** that fixed-order requirement is superseded by stream-order rendering for this package

## ADDED Requirements

### Requirement: Observable streaming acceptance without micro-benchmarks

Streaming behavior SHALL be accepted on observable merge, pairing, cancel, and usability properties. OpenSpec MUST NOT encode microsecond/FPS micro-benchmarks as acceptance criteria for this package.

#### Scenario: Mid-stream cancel keeps partial work

- **WHEN** a turn is running under text-input focus and the user cancels via Esc (per `tui-enhanced-input` / focus priority)
- **THEN** already-rendered thinking, text, and tool items remain visible
- **AND** turn cancelled / complete semantics follow existing `turn_cancelled` handling

#### Scenario: Long sessions remain structurally usable

- **WHEN** many turns complete over a session
- **THEN** completed vs active turn separation continues to work
- **AND** a new `user_message` starts a new turn
- **AND** no virtualization or FPS number is required as a MUST

#### Scenario: Non-timeline thinking control events may be ignored

- **WHEN** `thinking_start`, `thinking_end`, or `thinking_level_changed` events arrive
- **THEN** the timeline reducer MAY ignore them without failing progressive alignment

### Requirement: Compaction notice on existing events

The TUI SHALL consume existing `compaction_start` / `compaction_end` events (optional result fields may inform copy) for transcript presentation without requiring new agent event fields. The TUI SHOULD show a visible compaction system row or notice when those events fire. Glyph/copy cloning of Claude compaction chrome is a non-goal.

#### Scenario: Compaction end produces a visible notice

- **WHEN** `compaction_end` is received after a compaction run
- **THEN** the TUI can present a visible compaction notice or system row on the transcript
- **AND** absence of a new agent event type is not a defect

#### Scenario: Compaction does not require agent seam work

- **WHEN** compaction presentation is implemented for this package
- **THEN** it MUST use existing `compaction_*` events only
