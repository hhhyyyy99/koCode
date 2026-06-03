## ADDED Requirements

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
