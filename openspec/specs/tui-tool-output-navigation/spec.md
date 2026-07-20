# tui-tool-output-navigation Specification

## Purpose
Tool-card focus, expand/collapse, and long-output scannability under the shared expandable transcript block model.

## Requirements
### Requirement: Tool cards expose visible focus

The TUI SHALL show which tool card is focused when expandable transcript block navigation is active and the focused block is a tool card. This capability references the shared expandable transcript block contract from `tui-expandable-transcript-blocks` and MUST NOT re-author a conflicting tool-only navigation model.

#### Scenario: Tool focus marker appears

- **WHEN** the user enters expandable transcript block navigation for a turn with tool cards
- **AND** the focused expandable block is a tool card
- **THEN** exactly one tool card displays a visible focus marker

### Requirement: Tool expansion key matches displayed hint

The TUI SHALL ensure the displayed expand/collapse hint matches the actual keyboard shortcut for the shared expandable transcript block model.

#### Scenario: Ctrl+O expands focused tool

- **WHEN** a focused collapsed tool card displays a `ctrl+o` expand hint and the user presses Ctrl+O
- **THEN** that tool card expands to show detailed output

#### Scenario: Ctrl+O accepts Ink Ctrl-letter input

- **WHEN** the terminal input layer delivers Ctrl+O as a ctrl-letter combination
- **THEN** the TUI treats it as the expand/collapse shortcut for the focused expandable tool block

#### Scenario: Ctrl+O enters tool-output focus and toggles

- **WHEN** expandable tool/thinking blocks exist, input focus is active, and the user presses Ctrl+O
- **THEN** the TUI enters expandable transcript block focus
- **AND** the selected tool or thinking block expands or collapses in the same keypress

### Requirement: Expanded tool output can collapse

The TUI SHALL allow expanded tool output to return to its collapsed summary through the same shared shortcut.

#### Scenario: Collapse expanded tool

- **WHEN** a focused tool card is expanded and the user presses Ctrl+O
- **THEN** the tool card returns to collapsed summary view

### Requirement: Long output remains scannable by default

Long tool output SHALL remain scannable by default via collapsed summary first; full detail requires expand. Default collapsed view MUST follow the human-readable summary contract in `tui-tool-card-realignment` rather than dumping full raw JSON.

#### Scenario: Long output truncates behind expand

- **WHEN** tool output is long
- **THEN** the default collapsed view stays short and scannable
- **AND** full detail is available after expand via the shared expandable-block shortcut
