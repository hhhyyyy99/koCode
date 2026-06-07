## ADDED Requirements

### Requirement: Tab completion follows highlighted command
The TUI SHALL complete the slash command currently highlighted in the command panel when the user presses Tab.

#### Scenario: Tab completes selected non-first command
- **GIVEN** the slash command panel is open with multiple matching commands
- **AND** the highlighted command is not the first visible or filtered command
- **WHEN** the user presses Tab
- **THEN** the input is replaced with the highlighted command text
- **AND** the cursor is placed at the end of the completed command text
- **AND** the first filtered command is not used unless it is also highlighted

#### Scenario: Tab completes selected argument command
- **GIVEN** the slash command panel is open
- **AND** the highlighted command requires arguments
- **WHEN** the user presses Tab
- **THEN** the input is replaced with the command name followed by one trailing space
- **AND** the cursor is placed after the trailing space

### Requirement: Command filter ranks name matches before description matches
The TUI SHALL rank slash command filter results by match relevance so command-name matches appear before description-only matches.

#### Scenario: Exact command name outranks description synonym
- **WHEN** the user types `/exit`
- **THEN** `/exit` appears before `/quit` in the command panel results
- **AND** `/exit` is selected by default

#### Scenario: Description matches remain available
- **WHEN** the user types a term that matches a command description but not its command name
- **THEN** matching commands remain visible in the command panel

#### Scenario: Empty query preserves default command order
- **WHEN** the user types only `/`
- **THEN** the command panel shows commands in the default registry order
