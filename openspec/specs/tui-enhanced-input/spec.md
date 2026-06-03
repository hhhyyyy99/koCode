# tui-enhanced-input Specification

## Purpose
TBD - created by archiving change kocode-tui-rewrite. Update Purpose after archive.
## Requirements
### Requirement: Bordered input box with placeholder

The input box SHALL be enclosed in a visible border and SHALL show a placeholder hint when empty.

#### Scenario: Input box displayed with border

- **WHEN** the TUI is rendered
- **THEN** the input box is displayed with a single-line border

#### Scenario: Placeholder shown when empty

- **WHEN** the input box is empty and not disabled
- **THEN** a placeholder hint is displayed (e.g., "输入消息，或 / 查看命令...")

### Requirement: Multi-line input via Alt+Enter

The input box SHALL support multi-line input where `Alt+Enter` (or `Option+Enter`) inserts a newline character without submitting, and `Enter` alone submits the message.

#### Scenario: Enter submits

- **WHEN** user presses Enter without Alt/Option held
- **THEN** the current input content is submitted

#### Scenario: Alt+Enter inserts newline

- **WHEN** user presses Alt+Enter (or Option+Enter)
- **THEN** a newline character is inserted at the cursor position

### Requirement: Keyboard shortcut hints

The input box area SHALL display keyboard shortcut hints (e.g., "Enter 发送 · Alt+Enter 换行 · Esc 取消") to guide the user.

#### Scenario: Shortcut hints visible

- **WHEN** the input box is rendered
- **THEN** keyboard shortcut hints are displayed below or beside the input area

### Requirement: IME composition handling

The input box SHALL NOT trigger the command panel during IME (Input Method Editor) composition, even if the input contains a `/` character.

#### Scenario: IME composition does not trigger command panel

- **WHEN** user is composing text via an IME and types `/`
- **THEN** the command panel does not appear until composition ends and the input text evaluates to a `/` prefix

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

