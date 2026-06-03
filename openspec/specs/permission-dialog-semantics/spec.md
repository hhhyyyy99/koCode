# permission-dialog-semantics Specification

## Purpose
TBD - created by archiving change kocode-tool-permission-taxonomy. Update Purpose after archive.
## Requirements
### Requirement: Dialog title matches permission category
The TUI SHALL render permission dialog titles from the permission category without misleading fallbacks.

#### Scenario: Write permission title
- **WHEN** the permission request category is file creation
- **THEN** the dialog title is `Create file`

#### Scenario: Edit permission title
- **WHEN** the permission request category is file edit
- **THEN** the dialog title is `Edit file`

#### Scenario: Bash permission title
- **WHEN** the permission request category is command execution
- **THEN** the dialog title is `Bash command`

#### Scenario: Unknown permission title
- **WHEN** the permission request category is unknown or generic
- **THEN** the dialog title is neutral and does not say `Create file`

### Requirement: Read-only tools do not show mutation wording
The TUI SHALL NOT show file mutation wording for read-only tools.

#### Scenario: ls does not show create file
- **WHEN** a read-only `ls` action is displayed in the TUI
- **THEN** no permission dialog says `Create file` for that action

### Requirement: Allow-all wording matches category
The TUI SHALL render allow-all option text that matches the permission category and scope.

#### Scenario: Bash allow-all wording
- **WHEN** the permission request category is command execution
- **THEN** the allow-all option names the command family or command scope

#### Scenario: File mutation allow-all wording
- **WHEN** the permission request category is file creation or file edit
- **THEN** the allow-all option names file edit/write scope, not read-only scope

#### Scenario: Unknown allow-all wording
- **WHEN** the permission request category is unknown
- **THEN** the allow-all option avoids claiming the action is a file edit or file creation

