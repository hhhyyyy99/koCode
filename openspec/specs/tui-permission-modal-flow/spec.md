# tui-permission-modal-flow Specification

## Purpose
TBD - created by archiving change kocode-tui-interaction-integrity. Update Purpose after archive.
## Requirements
### Requirement: Permission request owns keyboard input
The TUI SHALL route decision keys only to the permission dialog while a permission request is pending.

#### Scenario: Arrow keys select permission option
- **WHEN** a permission dialog is focused and the user presses Up or Down
- **THEN** the selected permission option changes and slash command selection does not change

### Requirement: Permission resolution resumes pending action
The TUI SHALL send the selected permission response and allow the pending tool flow to continue or stop according to that response.

#### Scenario: Approve permission
- **WHEN** the user approves a permission request
- **THEN** the TUI sends an approve response and the pending tool operation continues

#### Scenario: Deny permission
- **WHEN** the user denies a permission request
- **THEN** the TUI sends a deny response and the pending tool operation does not execute

### Requirement: Permission close restores prior focus
The TUI SHALL restore a usable focus mode after a permission dialog resolves.

#### Scenario: Return to input after permission
- **WHEN** a permission dialog resolves and no other modal is active
- **THEN** focus returns to input and the user can continue editing or submit the next prompt

