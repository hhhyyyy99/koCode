## ADDED Requirements

### Requirement: Session branching
The system SHALL support creating a conversation branch from the current turn via `/branch` command.

#### Scenario: Create branch
- **WHEN** user runs `/branch <name>`
- **THEN** a new branch is created from the current conversation state
- **AND** the branch name is recorded in session metadata
- **AND** the user continues in the original branch

#### Scenario: List branches
- **WHEN** user runs `/branch` without arguments
- **THEN** all branches for the current session are listed
- **AND** the current branch is marked

### Requirement: Session resume
The system SHALL support resuming a previous session via `/resume` command.

#### Scenario: Resume session list
- **WHEN** user runs `/resume`
- **THEN** a list of recent sessions is displayed with:
  - Session name
  - Last access time
  - Model used
  - Turn count

#### Scenario: Select session to resume
- **WHEN** user selects a session from the list
- **THEN** the conversation history for that session is loaded
- **AND** the user can continue the conversation
