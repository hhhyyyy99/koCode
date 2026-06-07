## ADDED Requirements

### Requirement: Slash panel updates while deleting completed input
The command panel SHALL remain synchronized with the input while the user deletes slash command text, including text inserted by completion.

#### Scenario: Deleting completed command updates filter
- **WHEN** the command panel is open after completing `/help`
- **AND** the user presses the erase key
- **THEN** the input changes to `/hel`
- **AND** the command panel remains open with filtering based on `/hel`

#### Scenario: Deleting slash closes panel when prefix removed
- **WHEN** the command panel is open with input `/`
- **AND** the user presses the erase key
- **THEN** the input becomes empty
- **AND** the command panel closes
- **AND** focus returns to normal input mode
