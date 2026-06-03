# tui-external-editor Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: External editor launch
The system SHALL support Ctrl+G to open the current input in the user's configured `$EDITOR`.

#### Scenario: Ctrl+G opens editor
- **WHEN** user presses Ctrl+G while focused in the input area
- **THEN** the current input text is written to a temporary file
- **AND** the `$EDITOR` (default: vim) is opened with that file
- **AND** the TUI suspends (if in fullscreen mode)

#### Scenario: Editor returns content
- **WHEN** the user saves and quits the editor
- **THEN** the file content is read back into the input area
- **AND** the TUI resumes
- **AND** the user can review and submit the edited content

#### Scenario: Empty editor cancelled
- **WHEN** the user quits the editor without saving changes
- **THEN** the original input text is preserved

### Requirement: Alternative editor shortcut
The system SHALL support Ctrl+X Ctrl+E as an alternative shortcut for external editor launch.

#### Scenario: Ctrl+X Ctrl+E opens editor
- **WHEN** user presses Ctrl+X followed by Ctrl+E
- **THEN** the external editor is launched (same behavior as Ctrl+G)

