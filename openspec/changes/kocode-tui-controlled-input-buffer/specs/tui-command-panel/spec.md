## ADDED Requirements

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
