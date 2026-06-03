# tui-tool-output-navigation Specification

## Purpose
TBD - created by archiving change kocode-tui-interaction-integrity. Update Purpose after archive.
## Requirements
### Requirement: Tool cards expose visible focus
The TUI SHALL show which tool card is focused when tool-output navigation is active.

#### Scenario: Tool focus marker appears
- **WHEN** the user enters tool-output navigation for a turn with tool cards
- **THEN** exactly one tool card displays a visible focus marker

### Requirement: Tool expansion key matches displayed hint
The TUI SHALL ensure the displayed expand/collapse hint matches the actual keyboard shortcut.

#### Scenario: Ctrl+O expands focused tool
- **WHEN** a focused collapsed tool card displays `ctrl+o to expand` and the user presses Ctrl+O
- **THEN** that tool card expands to show detailed output

### Requirement: Expanded tool output can collapse
The TUI SHALL allow expanded tool output to return to its collapsed summary.

#### Scenario: Collapse expanded tool
- **WHEN** a focused tool card is expanded and the user presses the documented collapse shortcut
- **THEN** the tool card returns to collapsed summary view

### Requirement: Long output remains scannable by default
The TUI SHALL keep long tool output collapsed or truncated by default while preserving access to full details.

#### Scenario: Long output truncates
- **WHEN** a completed tool has output longer than the collapsed line limit
- **THEN** the collapsed card shows a summary and a visible remaining-lines hint

