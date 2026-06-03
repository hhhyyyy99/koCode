## ADDED Requirements

### Requirement: Input history search
The system SHALL support Ctrl+R to search through input history and recall previous messages.

#### Scenario: Ctrl+R opens history search
- **WHEN** user presses Ctrl+R in the input area
- **THEN** a history search prompt is displayed
- **AND** the user can type to filter previous inputs

#### Scenario: Selecting a history entry
- **WHEN** a matching history entry is found
- **THEN** pressing Enter restores that entry to the current input
- **AND** the search prompt closes

#### Scenario: No matching history
- **WHEN** no previous inputs match the search term
- **THEN** a "No matches" message is shown

### Requirement: Input history storage
The system SHALL store the last 100 user inputs in memory for history search.

#### Scenario: History persists within session
- **WHEN** user sends multiple messages
- **THEN** each message is appended to the history list
- **AND** the history is available for Ctrl+R search
- **AND** history is limited to 100 entries (oldest discarded)
