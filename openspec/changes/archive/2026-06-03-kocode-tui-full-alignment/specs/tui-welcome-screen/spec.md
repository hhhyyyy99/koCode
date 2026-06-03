## ADDED Requirements

### Requirement: Welcome screen display
The system SHALL render a welcome screen when no conversation events exist, replacing the current "No messages yet" placeholder.

#### Scenario: First launch
- **WHEN** the TUI starts with zero events
- **THEN** the welcome screen displays the koCode ASCII logo
- **AND** shows version number (vX.Y.Z)
- **AND** shows current model info with context window
- **AND** shows current working directory
- **AND** the input area remains active below

#### Scenario: After /clear
- **WHEN** the user runs `/clear` to clear conversation
- **THEN** the welcome screen reappears (events array is empty)

### Requirement: Welcome screen tips
The system SHALL display getting-started tips on the welcome screen.

#### Scenario: Tips display
- **WHEN** the welcome screen is shown
- **THEN** tips include at minimum: /help, /model, /clear commands
- **AND** tips are rendered in dimmed text
