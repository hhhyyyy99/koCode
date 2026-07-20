## ADDED Requirements

### Requirement: Terminal delete key deletes backward in text input
The input area SHALL treat terminal Backspace/delete-key events as backward deletion in normal text-entry contexts when the terminal input layer reports Backspace as a delete key.

#### Scenario: Delete key removes previous character at end of input
- **WHEN** the input text is `abc` with the cursor at the end
- **AND** the terminal input layer reports the user's erase key as delete
- **THEN** the input becomes `ab`
- **AND** the cursor is placed after `b`

#### Scenario: Delete key removes previous character after completion
- **WHEN** the input text is `/help` with the cursor at the end after command completion
- **AND** the terminal input layer reports the user's erase key as delete
- **THEN** the input becomes `/hel`
- **AND** the cursor is placed after `l`

#### Scenario: Repeated delete can clear input
- **WHEN** the user repeatedly presses the erase key while text remains before the cursor
- **THEN** each key press removes one previous character
- **AND** the input can return to empty text with cursor offset zero
