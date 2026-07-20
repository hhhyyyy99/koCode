## MODIFIED Requirements

### Requirement: Output truncation with expand hint
The system SHALL truncate tool output beyond a visible threshold and show `… +N lines (ctrl+o to expand)`.

#### Scenario: Tool output exceeds threshold
- **WHEN** tool output exceeds 10 lines in collapsed state
- **THEN** the output is truncated to first 10 lines
- **AND** displays `… +N lines (ctrl+o to expand)` in dimmed text

#### Scenario: Expand truncated output
- **WHEN** user presses Ctrl+O on a focused truncated tool card
- **THEN** the card expands to show full output
