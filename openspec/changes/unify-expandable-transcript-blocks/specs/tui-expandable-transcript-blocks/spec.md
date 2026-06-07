## ADDED Requirements

### Requirement: Transcript blocks expose unified expansion keys
The TUI SHALL derive a single ordered list of expandable transcript block keys from rendered assistant turn items.

#### Scenario: Mixed thinking and tool blocks are ordered visually
- **WHEN** a turn contains text, thinking blocks, and tool cards in chronological order
- **THEN** only thinking blocks and tool cards are included in the expandable block key list
- **AND** their keys appear in the same top-to-bottom order as the rendered transcript

### Requirement: Ctrl+O toggles focused transcript block
The TUI SHALL use Ctrl+O to expand or collapse the currently focused expandable transcript block.

#### Scenario: Expand focused thinking block
- **WHEN** a collapsed thinking block is focused and the user presses Ctrl+O
- **THEN** the thinking block expands to show its full available content

#### Scenario: Expand focused tool block
- **WHEN** a collapsed tool card is focused and the user presses Ctrl+O
- **THEN** the tool card expands to show detailed output

#### Scenario: Collapse focused transcript block
- **WHEN** an expanded thinking block or tool card is focused and the user presses Ctrl+O
- **THEN** that block returns to its collapsed summary view

### Requirement: First Ctrl+O enters block focus and toggles
The TUI SHALL make the first Ctrl+O keypress actionable when expandable transcript blocks are present.

#### Scenario: Toggle from input focus
- **WHEN** expandable transcript blocks exist, input focus is active, and the user presses Ctrl+O
- **THEN** the TUI enters expandable transcript block focus
- **AND** the selected block expands or collapses in the same keypress

### Requirement: Transcript block hints match shortcut
Expandable transcript blocks SHALL display hints that match their Ctrl+O expand/collapse behavior.

#### Scenario: Collapsed block hint
- **WHEN** a thinking block or tool card is collapsed and can expand
- **THEN** the block indicates `ctrl+o to expand`

#### Scenario: Expanded block hint
- **WHEN** a thinking block or tool card is expanded
- **THEN** the block indicates `ctrl+o to collapse`
