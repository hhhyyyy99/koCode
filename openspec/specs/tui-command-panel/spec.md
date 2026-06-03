# tui-command-panel Specification

## Purpose
TBD - created by archiving change kocode-tui-rewrite. Update Purpose after archive.
## Requirements
### Requirement: Slash command panel triggered by / input

The TUI SHALL display an interactive command panel when the user types `/` in the input box. The panel SHALL appear below the input box and SHALL list all available commands with their descriptions.

#### Scenario: Command panel opens on /

- **WHEN** user types `/` at the beginning of the input
- **THEN** the command panel appears below the input box showing all available commands

#### Scenario: Real-time filtering

- **WHEN** user continues typing after `/`
- **THEN** the command panel filters the list to show only commands whose names or descriptions match the input

#### Scenario: Keyboard navigation

- **WHEN** the command panel is open
- **THEN** `↑` and `↓` keys move the selection highlight, `Enter` fills the selected command into the input box, and `Escape` closes the panel

#### Scenario: Panel closes on non-command input

- **WHEN** user deletes the `/` character or types text that does not start with `/`
- **THEN** the command panel closes

### Requirement: Command registration system

The system SHALL provide a command registry that maps command names (e.g., `/help`, `/model`, `/clear`) to their descriptions and handler functions.

#### Scenario: Command registry contains all built-in commands

- **WHEN** the command registry is initialized
- **THEN** it contains at minimum: `/help`, `/model`, `/models`, `/clear`, `/session`, `/status`, `/quit`, `/exit`

#### Scenario: Command handlers are invocable

- **WHEN** a registered command is selected and confirmed
- **THEN** the corresponding handler function is called with the provided arguments

### Requirement: Command panel trigger and filter
The system SHALL display the command panel below the input area when the user types `/`, filtering commands in real-time as the user continues typing.

#### Scenario: Slash triggers command panel
- **WHEN** the user types `/` as the first character in the input
- **THEN** the command panel appears below the input area
- **AND** all commands are listed (unfiltered)
- **AND** the first command is selected by default

#### Scenario: Filtering commands
- **WHEN** the user types `/mod` in the input
- **THEN** only commands matching "mod" in name or description are shown
- **AND** the list updates on each keystroke

### Requirement: Command panel expands to 20+ commands
The system SHALL include at minimum 20 built-in commands organized by category, matching Claude Code's command set.

#### Scenario: Categories visible
- **WHEN** the command panel is displayed
- **THEN** commands are grouped by category: Session, Information, Configuration, Development

#### Scenario: Full command set
- **WHEN** all commands are listed
- **THEN** the command set SHALL include: /help, /clear, /compact, /context, /cost, /diff, /status, /model, /models, /config, /init, /permissions, /theme, /resume, /branch, /quit, /exit, /feedback, /doctor, /export, /review, /skills

### Requirement: Command keyboard navigation
The system SHALL support up/down arrow keys to navigate the command list, Enter to select, and Escape to close.

#### Scenario: Arrow key navigation
- **WHEN** the command panel is open
- **THEN** pressing ↓ moves selection down (wrap to top)
- **AND** pressing ↑ moves selection up (wrap to bottom)
- **AND** the selected command is highlighted in cyan bold with ❯ prefix

#### Scenario: Enter selects command
- **WHEN** a command is selected and Enter is pressed
- **THEN** the input is set to the command name + space
- **AND** the command panel closes
- **AND** the cursor is positioned after the space for arguments

#### Scenario: Escape closes panel
- **WHEN** Escape is pressed while command panel is open
- **THEN** the command panel closes
- **AND** the input is cleared

