## MODIFIED Requirements

### Requirement: Tool call cards with collapse

Each tool call SHALL be displayed as a card showing the tool name, with collapse/expand toggling of the input parameters and result content through the unified expandable transcript block model.

#### Scenario: Tool card shows running state

- **WHEN** a `tool_start` event is received
- **THEN** a tool card appears showing the tool name and a running indicator

#### Scenario: Tool card shows result on completion

- **WHEN** a `tool_end` event is received
- **THEN** the tool card updates to show success (✓) or error (✗) status, and the result content

#### Scenario: Tool card collapse toggle

- **WHEN** user presses Ctrl+O while a completed tool card is the focused expandable transcript block
- **THEN** the card toggles between expanded (showing full details) and collapsed (showing one-line summary)

### Requirement: Thinking blocks with collapse

Thinking content SHALL be displayed in dimmed style, grouped by thinking block, collapsed by default, and controlled by the unified expandable transcript block model.

#### Scenario: Thinking block starts collapsed

- **WHEN** a `thinking_delta` event arrives for the current Turn
- **THEN** the thinking content is displayed in a collapsed block with dimmed text
- **AND** the block can be included in expandable transcript block navigation

#### Scenario: Thinking block expandable

- **WHEN** user presses Ctrl+O while the thinking block is the focused expandable transcript block
- **THEN** the thinking block expands to show full available content

#### Scenario: Thinking block collapse

- **WHEN** an expanded thinking block is focused and the user presses Ctrl+O
- **THEN** the thinking block returns to collapsed view
