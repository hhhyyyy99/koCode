## MODIFIED Requirements

### Requirement: Tool expansion key matches displayed hint
The TUI SHALL ensure the displayed expand/collapse hint matches the actual keyboard shortcut.

#### Scenario: Ctrl+O expands focused tool
- **WHEN** a focused collapsed tool card displays `ctrl+o to expand` and the user presses Ctrl+O
- **THEN** that tool card expands to show detailed output

#### Scenario: Ctrl+O accepts Ink Ctrl-letter input
- **WHEN** Ink reports Ctrl+O as `key.ctrl = true` with input `o`
- **THEN** the TUI treats the keypress as the documented tool expand/collapse shortcut

#### Scenario: Ctrl+O enters tool-output focus and toggles
- **WHEN** tool cards exist, tool-output navigation is not active, and the user presses Ctrl+O
- **THEN** the TUI enters tool-output navigation
- **AND** the focused tool card expands or collapses in the same keypress

### Requirement: Expanded tool output can collapse
The TUI SHALL allow expanded tool output to return to its collapsed summary.

#### Scenario: Collapse expanded tool
- **WHEN** a focused tool card is expanded and the user presses Ctrl+O
- **THEN** the tool card returns to collapsed summary view
