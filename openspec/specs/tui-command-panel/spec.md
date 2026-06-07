# tui-command-panel Specification

## Purpose
TBD - created by archiving change kocode-tui-rewrite. Update Purpose after archive.
## Requirements
### Requirement: Slash command panel triggered by / input

The TUI SHALL display an interactive unbordered command completion list when the user types `/` in the input box. The list SHALL appear below the input area separator and SHALL list available commands with aligned descriptions.

#### Scenario: Command panel opens on /

- **WHEN** user types `/` at the beginning of the input
- **THEN** the command panel appears below the input area separator showing all available commands
- **AND** the panel is not enclosed in a rounded or rectangular border
- **AND** the status bar does not appear between the input area separator and the command panel

#### Scenario: Real-time filtering

- **WHEN** user continues typing after `/`
- **THEN** the command panel filters the list to show only commands whose names or descriptions match the input

#### Scenario: Keyboard navigation

- **WHEN** the command panel is open
- **THEN** `↑` and `↓` keys move the selection highlight, `Enter` fills or runs the selected command according to command metadata, and `Escape` closes the panel

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
The system SHALL display the command panel below the input area separator when the user types `/`, filtering commands in real-time as the user continues typing.

#### Scenario: Slash triggers command panel
- **WHEN** the user types `/` as the first character in the input
- **THEN** the command panel appears below the input area separator
- **AND** all commands are listed (unfiltered)
- **AND** the first command is selected by default
- **AND** rows reserve stable columns for selection marker, command name, and description
- **AND** the command panel is visually adjacent to the input frame

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
- **AND** the selected command is highlighted with `❯` prefix
- **AND** unselected rows reserve the same prefix width so command names remain aligned

#### Scenario: Enter selects command
- **WHEN** a command is selected and Enter is pressed
- **THEN** the command is selected according to its argument requirements
- **AND** the command panel closes
- **AND** focus returns to the input or the opened command modal

#### Scenario: Escape closes panel
- **WHEN** Escape is pressed while command panel is open
- **THEN** the command panel closes
- **AND** the input is cleared

### Requirement: Command completion cursor placement
The command panel SHALL place the input cursor at the intended edit position whenever a command is completed or filled into the input.

#### Scenario: Tab completion places cursor at end
- **WHEN** the command panel is open and the user presses Tab on a matching command
- **THEN** the input is replaced with the completed command text
- **AND** the cursor is placed at the end of the completed command text
- **AND** the next printable character is appended after the completed command text

#### Scenario: Argument command fill places cursor after trailing space
- **WHEN** the user selects a command that requires arguments
- **THEN** the command name and one trailing space are filled into the input
- **AND** the command panel closes
- **AND** the cursor is placed after the trailing space so argument typing begins in the argument position

#### Scenario: Exact command execution does not leave stale cursor
- **WHEN** the user submits an exact slash command that executes immediately
- **THEN** the input buffer is cleared
- **AND** any subsequent typed input starts from an empty buffer at cursor offset zero

### Requirement: Claude-like command row formatting

The command panel SHALL format each visible command row using stable text columns: selection marker, command name, description, and optional source metadata.

#### Scenario: Command description alignment
- **WHEN** the command panel displays multiple commands
- **THEN** command names start in the same column
- **AND** descriptions start in the same column

#### Scenario: Source metadata display
- **WHEN** a command has source or scope metadata such as `project`
- **THEN** the panel displays the metadata as a dimmed continuation line formatted like `(project)`
- **AND** the continuation line is indented to the description column

#### Scenario: Long description wrapping
- **WHEN** a command description exceeds the available width
- **THEN** wrapped description text remains aligned with the description column
