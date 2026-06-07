## MODIFIED Requirements

### Requirement: Tool cards expose visible focus
The TUI SHALL show which tool card is focused when expandable transcript block navigation is active and the focused block is a tool card.

#### Scenario: Tool focus marker appears
- **WHEN** the user enters expandable transcript block navigation for a turn with tool cards
- **AND** the focused expandable block is a tool card
- **THEN** exactly one tool card displays a visible focus marker

### Requirement: Tool expansion key matches displayed hint
The TUI SHALL ensure the displayed expand/collapse hint matches the actual keyboard shortcut.

#### Scenario: Ctrl+O expands focused tool
- **WHEN** a focused collapsed tool card displays `ctrl+o to expand` and the user presses Ctrl+O
- **THEN** that tool card expands to show detailed output

### Requirement: Expanded tool output can collapse
The TUI SHALL allow expanded tool output to return to its collapsed summary.

#### Scenario: Collapse expanded tool
- **WHEN** a focused tool card is expanded and the user presses Ctrl+O
- **THEN** the tool card returns to collapsed summary view
