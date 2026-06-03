## ADDED Requirements

### Requirement: Multi-prefix input parsing
The system SHALL support `!`, `#`, `@`, `/` prefixes in addition to plain text input, routing each prefix to the appropriate handler.

#### Scenario: Shell prefix routing
- **WHEN** user submits input starting with `!`
- **THEN** the text after `!` is executed as a shell command
- **AND** the output is displayed as a Bash tool card
- **AND** no AI turn is started

#### Scenario: Memory prefix routing
- **WHEN** user submits input starting with `#`
- **THEN** the text after `#` is written to project memory file
- **AND** a confirmation is shown

#### Scenario: At-prefix passed through
- **WHEN** user submits input starting with `@`
- **THEN** the full text including `@` is sent to the AI as a normal message

#### Scenario: Plain text sent to AI
- **WHEN** user submits text without any prefix
- **THEN** the text is sent to the AI via `session.prompt()`

### Requirement: Multi-line input
The system SHALL support multi-line input via Alt+Enter and Ctrl+J.

#### Scenario: Alt+Enter inserts newline
- **WHEN** user presses Alt+Enter while focused in the input
- **THEN** a newline character is inserted at cursor position
- **AND** the input area grows to show all lines

#### Scenario: Ctrl+J inserts newline
- **WHEN** user presses Ctrl+J while focused in the input
- **THEN** a newline character is inserted at cursor position

### Requirement: Disabled state
The system SHALL show a disabled/thinking state when the AI is processing.

#### Scenario: Thinking state
- **WHEN** the AI is running (turn_start received but not yet turn_end/turn_cancelled)
- **THEN** the input is replaced with `● Thinking...` in yellow text
- **AND** keyboard input is not accepted

### Requirement: Input prompt symbol
The system SHALL render `❯` as the input prompt symbol in green bold.

#### Scenario: Prompt display
- **WHEN** input area is rendered in normal state
- **THEN** `❯` is displayed as the leftmost character in green bold
- **AND** the text input follows immediately after
