## ADDED Requirements

### Requirement: Header information hierarchy
The system SHALL render the Header with a three-line information hierarchy in welcome mode and a compact two-line mode during active conversation.

#### Scenario: Header in welcome mode
- **WHEN** no conversation has started (events.length === 0)
- **THEN** the Header renders with ASCII logo on its own line
- **AND** "Welcome!" greeting on the second line
- **AND** model info (provider/id · context window) on the third line
- **AND** current working directory on the fourth line

#### Scenario: Header during active conversation
- **WHEN** at least one turn exists in the conversation
- **THEN** the Header renders without logo and greeting
- **AND** shows koCode version + model info on one line
- **AND** working directory on the second line

### Requirement: Model and session info display
The system SHALL display the current model, context window size, and working directory in the header.

#### Scenario: Model info format
- **WHEN** the header renders
- **THEN** model info SHALL be formatted as `<provider>/<model-id> · <N>k context`
- **AND** cwd is shown as the absolute path in dimmed text
