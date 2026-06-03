# tui-status-bar Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Status bar layout
The system SHALL render a persistent bottom status bar below the input area with left-aligned shortcut hints and right-aligned mode indicator.

#### Scenario: Default status bar
- **WHEN** the TUI is in normal conversation mode
- **THEN** the left side shows `? for shortcuts`
- **AND** the right side shows the current permission mode (e.g., `◉ Default`)

#### Scenario: Status bar when AI is running
- **WHEN** a turn is in streaming state
- **THEN** the right side shows `● Running...` in yellow

### Requirement: Shortcut hint display
The system SHALL display the most relevant keyboard shortcuts based on current state.

#### Scenario: Normal mode shortcuts
- **WHEN** no special mode is active
- **THEN** the left side displays `? for shortcuts` in dimmed text

#### Scenario: Tool card expanded mode
- **WHEN** a tool card is expanded
- **THEN** the left side displays `Ctrl+O to collapse` hint

