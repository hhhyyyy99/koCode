## MODIFIED Requirements

### Requirement: Conversation rendered as grouped turns

The TUI SHALL group conversation events into Turns, where each Turn contains one user message and the assistant's complete response. Within the assistant response, displayed thinking blocks, text blocks, and tool call cards SHALL preserve their observable event order.

#### Scenario: New turn starts on user message

- **WHEN** the TUI receives a `user_message` event
- **THEN** a new Turn is created and displayed with the user's message content

#### Scenario: Turn accumulates assistant response in order

- **WHEN** the TUI receives `message_start`, `message_delta`, `message_end`, `tool_start`, `tool_end`, `thinking_delta` events during a turn
- **THEN** all assistant content is grouped under the same Turn
- **AND** assistant content blocks render in the same relative order that display-producing events were processed

#### Scenario: Turn preserves text-tool-text chronology

- **WHEN** a turn receives assistant text deltas, then a tool start/end pair, then later assistant text deltas
- **THEN** the earlier assistant text renders above the tool card
- **AND** the later assistant text renders below the tool card

#### Scenario: Turn completes on turn_end

- **WHEN** the TUI receives a `turn_end` event
- **THEN** the current Turn is marked as complete and moved to the static completed area

### Requirement: Tool card rendering within turn

The system SHALL render tool cards with the updated visual format (● ToolName(params), ⎿ prefix, line numbers, truncation) as defined in tui-tool-card-realignment, at the position where the tool call occurs in the turn's ordered assistant content.

#### Scenario: Tool card in active turn

- **WHEN** a turn has tool calls in any state (running/done/error)
- **THEN** each tool call renders as a card at its chronological position within the assistant content
- **AND** cards use the Claude Code visual convention

### Requirement: Thinking block rendering order

The system SHALL render thinking blocks in the turn's ordered assistant content without forcing them above all text and tool cards.

#### Scenario: Turn with thinking and tools and text

- **WHEN** a turn has thinking blocks, tool calls, AND text content
- **THEN** each thinking block renders at its chronological position within the assistant content
- **AND** each tool card renders at its chronological position within the assistant content
- **AND** each text block renders at its chronological position within the assistant content
- **AND** the completion marker renders at the bottom
