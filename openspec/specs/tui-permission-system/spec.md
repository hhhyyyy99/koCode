# tui-permission-system Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Permission dialog for file creation
The system SHALL display a permission dialog when the agent attempts to create a new file, showing full file content preview with line numbers.

#### Scenario: File creation dialog
- **WHEN** a permission_request for a Write tool is received
- **THEN** the dialog displays:
  - Title: "Create file"
  - File path (relative)
  - Full file content with line numbers (separated by ╌╌╌ lines)
  - Options: Yes / Yes, allow all edits in <dir>/ during this session / No
  - Footer: Esc to cancel · Tab to amend

#### Scenario: User approves file creation
- **WHEN** user selects "Yes" and presses Enter
- **THEN** the agent proceeds to create the file
- **AND** the dialog closes

#### Scenario: User denies file creation
- **WHEN** user selects "No" and presses Enter
- **THEN** the agent skips file creation
- **AND** a refusal message is shown

### Requirement: Permission dialog for file editing
The system SHALL display a permission dialog for file edits showing unified diff format.

#### Scenario: Edit dialog with diff
- **WHEN** a permission_request for an Edit tool is received
- **THEN** the dialog displays:
  - Title: "Edit file"
  - File path
  - Diff preview (removed lines in red, added lines in green, with line numbers)
  - Options: Yes / Yes, allow all edits in <dir>/ during this session / No

### Requirement: Permission dialog for Bash commands
The system SHALL display a permission dialog for bash commands showing the command and its description.

#### Scenario: Bash command dialog
- **WHEN** a permission_request for a Bash tool is received
- **THEN** the dialog displays:
  - Title: "Bash command"
  - The command text
  - The command description (natural language)
  - Options: Yes / Yes, and always allow <path> from this project / No
  - Footer: Esc to cancel · Tab to amend

### Requirement: Three-tier permission mode
The system SHALL support three permission modes: Default (ask for every tool), Accept Edits (auto-approve edit/write), Auto (auto-approve all).

#### Scenario: Default mode
- **WHEN** permission mode is "Default"
- **THEN** every tool call (Bash, Write, Edit) triggers a permission dialog

#### Scenario: Accept Edits mode
- **WHEN** permission mode is "Accept Edits"
- **THEN** Write and Edit tools are auto-approved
- **AND** Bash commands still trigger a permission dialog

#### Scenario: Auto mode
- **WHEN** permission mode is "Auto"
- **THEN** all tool calls are auto-approved without dialog

### Requirement: Tab to amend
The system SHALL allow the user to press Tab in a permission dialog to modify the proposed command before execution.

#### Scenario: Tab to amend
- **WHEN** user presses Tab in a permission dialog
- **THEN** the proposed command is copied to the input area for editing
- **AND** the dialog closes
- **AND** the user can edit and re-submit

