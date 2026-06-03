## ADDED Requirements

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
