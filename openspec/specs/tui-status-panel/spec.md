# tui-status-panel Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Status panel multi-tab
The system SHALL display a multi-tab status panel when `/status` is invoked, with Settings, Status, and Usage tabs.

#### Scenario: Status panel tabs
- **WHEN** user runs `/status`
- **THEN** the panel header shows `Settings  Status  Usage`
- **AND** the first tab (Settings) is selected by default
- **AND** ←/→ arrows switch between tabs

### Requirement: Status tab content
The system SHALL display session information in the Status tab.

#### Scenario: Status tab
- **WHEN** the Status tab is selected
- **THEN** the display SHALL include:
  - Version (koCode version)
  - Session name (auto-generated or custom)
  - Session ID (UUID)
  - cwd (current working directory)
  - Model (current model)
  - API base URL

### Requirement: Settings tab content
The system SHALL display configurable settings in key-value format in the Settings tab.

#### Scenario: Settings tab
- **WHEN** the Settings tab is selected
- **THEN** settings are displayed as key-value pairs:
  - Auto-compact (true/false)
  - Thinking mode (true/false)
  - Fast mode (true/false)
  - Default permission mode
  - Theme
- **AND** each setting shows its current value

### Requirement: Usage tab content
The system SHALL display session usage statistics in the Usage tab, matching the /cost command output format.

#### Scenario: Usage tab
- **WHEN** the Usage tab is selected
- **THEN** the display SHALL match the /cost command output

