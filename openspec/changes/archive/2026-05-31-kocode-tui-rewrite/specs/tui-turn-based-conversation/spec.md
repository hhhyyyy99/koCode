## ADDED Requirements

### Requirement: Conversation rendered as grouped turns

The TUI SHALL group conversation events into Turns, where each Turn contains one user message and the assistant's complete response (text blocks, thinking blocks, and tool calls).

#### Scenario: New turn starts on user message

- **WHEN** the TUI receives a `user_message` event
- **THEN** a new Turn is created and displayed with the user's message content

#### Scenario: Turn accumulates assistant response

- **WHEN** the TUI receives `message_start`, `message_delta`, `message_end`, `tool_start`, `tool_end`, `thinking_delta` events during a turn
- **THEN** all assistant content is grouped under the same Turn

#### Scenario: Turn completes on turn_end

- **WHEN** the TUI receives a `turn_end` event
- **THEN** the current Turn is marked as complete and moved to the static completed area

### Requirement: User message display

Each Turn SHALL display the user's message with a distinct visual prefix (e.g., "❯") and bold styling to differentiate it from assistant content.

#### Scenario: User message rendered

- **WHEN** a Turn contains a user message
- **THEN** the message is displayed with a distinct prefix and bold text style

### Requirement: Streaming assistant text

The TUI SHALL render assistant text content as streaming Markdown, updating in real-time as `message_delta` events arrive.

#### Scenario: Text appears incrementally

- **WHEN** `message_delta` events arrive for the current Turn
- **THEN** the displayed text updates incrementally with each delta

#### Scenario: Markdown rendered on completion

- **WHEN** the text block is complete
- **THEN** the content is rendered as Markdown (code blocks, bold, lists, headers)

### Requirement: Tool call cards with collapse

Each tool call SHALL be displayed as a card showing the tool name, with collapse/expand toggling of the input parameters and result content.

#### Scenario: Tool card shows running state

- **WHEN** a `tool_start` event is received
- **THEN** a tool card appears showing the tool name and a running indicator

#### Scenario: Tool card shows result on completion

- **WHEN** a `tool_end` event is received
- **THEN** the tool card updates to show success (✓) or error (✗) status, and the result content

#### Scenario: Tool card collapse toggle

- **WHEN** user presses Enter while a completed tool card is focused
- **THEN** the card toggles between expanded (showing full details) and collapsed (showing one-line summary)

### Requirement: Thinking blocks with collapse

Thinking content SHALL be displayed in dimmed style, grouped by thinking block, and collapsed by default.

#### Scenario: Thinking block starts collapsed

- **WHEN** a `thinking_delta` event arrives for the current Turn
- **THEN** the thinking content is displayed in a collapsed block with dimmed text

#### Scenario: Thinking block expandable

- **WHEN** user presses Enter while the thinking block is focused
- **THEN** the thinking block expands to show full content

### Requirement: Completed turns in Static

Completed Turns SHALL be rendered using Ink's `<Static>` component to avoid unnecessary re-renders and enable natural terminal scrollback.

#### Scenario: Completed turn moves to Static

- **WHEN** a Turn transitions from streaming to complete
- **THEN** it is rendered in a `<Static>` component and no longer participates in React re-renders

#### Scenario: Active turn in regular Box

- **WHEN** a Turn is currently receiving events
- **THEN** it is rendered in a regular `<Box>` component that updates on each event
