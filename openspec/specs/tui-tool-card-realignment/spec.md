# tui-tool-card-realignment Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Tool card symbol and format
The system SHALL render tool call cards using `● ToolName(params)` format with yellow `●` symbol, matching Claude Code's visual convention.

#### Scenario: Running tool
- **WHEN** a tool call starts (tool_start event)
- **THEN** the tool card displays `● ToolName(key_params)` in yellow bold text
- **AND** the card shows `Running...` below the header

#### Scenario: Completed tool
- **WHEN** a tool call completes (tool_end event with result)
- **THEN** the tool card replaces `●` with `✓` in green
- **AND** the result summary uses `⎿` prefix followed by one-line summary

### Requirement: Line numbers in tool output
The system SHALL render detailed tool output with line numbers for Edit and Write tools.

#### Scenario: Edit tool diff with line numbers
- **WHEN** an Edit tool result is expanded
- **THEN** each line of the diff displays its line number right-aligned
- **AND** removed lines show `-` prefix in red
- **AND** added lines show `+` prefix in green

#### Scenario: Write tool content with line numbers
- **WHEN** a Write tool result is expanded
- **THEN** the file content displays with line numbers

### Requirement: Output truncation with expand hint
The system SHALL truncate tool output beyond a visible threshold and show `… +N lines (ctrl+o to expand)`.

#### Scenario: Tool output exceeds threshold
- **WHEN** tool output exceeds 10 lines in collapsed state
- **THEN** the output is truncated to first 10 lines
- **AND** displays `… +N lines (ctrl+o to expand)` in dimmed text

#### Scenario: Expand truncated output
- **WHEN** user presses Enter on a focused truncated tool card
- **THEN** the card expands to show full output

