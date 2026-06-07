## ADDED Requirements

### Requirement: Controlled input buffer
The input area SHALL manage input text and cursor position as a single controlled buffer for both user edits and programmatic edits.

#### Scenario: Programmatic text replacement sets cursor
- **WHEN** the TUI replaces the current input text through command completion, history restore, external editor return, or another programmatic edit
- **THEN** the replacement updates both the displayed text and the cursor offset atomically
- **AND** the next printable character is inserted at the updated cursor offset

#### Scenario: Printable input inserts at cursor
- **WHEN** the input area has focus and the user types printable text
- **THEN** the text is inserted at the current cursor offset
- **AND** the cursor moves to the end of the inserted text

#### Scenario: Deletion edits around cursor
- **WHEN** the input area has focus and the user presses Backspace
- **THEN** the character before the current cursor offset is removed when one exists
- **AND** the cursor moves to the deletion position

#### Scenario: Cursor movement changes edit position
- **WHEN** the input area has focus and the user presses Left or Right
- **THEN** the cursor offset moves within the valid input text bounds
- **AND** later printable input uses the new cursor offset

### Requirement: Controlled multiline insertion
The input area SHALL insert explicit multiline shortcuts at the current cursor offset and keep cursor placement deterministic.

#### Scenario: Alt Enter inserts newline at cursor
- **WHEN** user presses Alt+Enter while focused in the input
- **THEN** a newline character is inserted at the current cursor offset
- **AND** the cursor is placed immediately after the inserted newline
- **AND** the input area grows to show the resulting lines

#### Scenario: Ctrl J inserts newline at cursor
- **WHEN** user presses Ctrl+J while focused in the input
- **THEN** a newline character is inserted at the current cursor offset
- **AND** the cursor is placed immediately after the inserted newline
