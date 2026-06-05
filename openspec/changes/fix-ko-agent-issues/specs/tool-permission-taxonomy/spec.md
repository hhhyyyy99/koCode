## MODIFIED Requirements

### Requirement: Mutating and execution tools remain gated
The agent SHALL require permission for file mutation and command execution tools in default permission mode, unless the tool category has been approved for the session via an `approve_all` action.

#### Scenario: Write prompts for file creation
- **WHEN** the model calls `write` in default permission mode and `write` category is not in `sessionApprovedCategories`
- **THEN** the agent emits a permission request classified as file creation

#### Scenario: Edit prompts for file edit
- **WHEN** the model calls `edit` in default permission mode and `edit` category is not in `sessionApprovedCategories`
- **THEN** the agent emits a permission request classified as file edit

#### Scenario: Bash prompts for command execution
- **WHEN** the model calls `bash` in default permission mode and `bash` category is not in `sessionApprovedCategories`
- **THEN** the agent emits a permission request classified as command execution

#### Scenario: Approve-all skips future permission checks for the same category
- **GIVEN** the user selects "Yes, allow all" for a `write` tool permission request
- **WHEN** the model subsequently calls `write` or `edit` in the same session
- **THEN** the agent executes the tool without emitting a permission request

#### Scenario: Approve-all is scoped to tool category
- **GIVEN** the user approved all `edit` tools via approve-all
- **WHEN** the model calls `bash`
- **THEN** the agent still emits a permission request for bash (different category)

#### Scenario: Approve-all does not persist across sessions
- **GIVEN** the user approved all `write` tools in session A
- **WHEN** a new session B starts in default permission mode
- **THEN** the agent emits permission requests for `write` as normal
