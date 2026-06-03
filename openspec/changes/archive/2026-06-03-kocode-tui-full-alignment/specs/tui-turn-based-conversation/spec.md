## ADDED Requirements

### Requirement: Turn renders completion marker
The system SHALL render a completion marker after each finished turn's assistant content.

#### Scenario: Turn ends with text reply
- **WHEN** a turn with text content receives turn_end
- **THEN** the completion marker `✻ <verb> for <duration>` is rendered below the last assistant content block
- **AND** the marker uses green ✻ symbol

#### Scenario: Turn ends with tool calls
- **WHEN** a turn with tool calls receives turn_end
- **THEN** the completion marker is rendered below the last tool card

### Requirement: Tool card rendering within turn
The system SHALL render tool cards with the updated visual format (● ToolName(params), ⎿ prefix, line numbers, truncation) as defined in tui-tool-card-realignment.

#### Scenario: Tool card in active turn
- **WHEN** a turn has tool calls in any state (running/done/error)
- **THEN** each tool call renders as a card between thinking block and text reply
- **AND** cards use the Claude Code visual convention

### Requirement: Thinking block rendering order
The system SHALL render thinking blocks above the assistant text reply and above tool cards.

#### Scenario: Turn with thinking and tools and text
- **WHEN** a turn has thinking blocks, tool calls, AND text content
- **THEN** thinking blocks render first (top)
- **AND** tool cards render next
- **AND** text reply renders last
- **AND** completion marker renders at the bottom
