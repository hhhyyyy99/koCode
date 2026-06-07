# tui-enhanced-input Specification

## Purpose
TBD - created by archiving change kocode-tui-rewrite. Update Purpose after archive.
## Requirements
### Requirement: Bordered input box with placeholder

The input area SHALL use a Claude-like separator frame rather than a box border: a full-width horizontal separator line above the prompt row and a full-width horizontal separator line below the prompt row. The input SHALL continue to show a placeholder hint when empty.

#### Scenario: Input area displayed with separator frame

- **WHEN** the TUI is rendered
- **THEN** the input area is displayed between two horizontal separator lines
- **AND** the separator lines span the active terminal width when width information is available
- **AND** the input area is not enclosed in a rounded or rectangular border

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

### Requirement: Disabled state
The system SHALL show a disabled/thinking state when the AI is processing.

#### Scenario: Thinking state
- **WHEN** the AI is running (turn_start received but not yet turn_end/turn_cancelled)
- **THEN** the input is replaced with `● Thinking...` in yellow text
- **AND** keyboard input is not accepted

### Requirement: Input prompt symbol
The system SHALL render `❯` as the input prompt symbol in green bold at the start of the prompt row inside the separator frame.

#### Scenario: Prompt display
- **WHEN** input area is rendered in normal state
- **THEN** `❯` is displayed as the leftmost prompt marker in green bold
- **AND** the text input follows immediately after the prompt marker
- **AND** the prompt row remains visually bounded by the horizontal separator above and below

### Requirement: Terminal-width input separators

The system SHALL compute input separator length from the current terminal width when available and SHALL use a stable fallback width for tests or non-TTY rendering.

#### Scenario: Wide terminal separators
- **WHEN** the TUI is rendered in a terminal wider than the fallback width
- **THEN** the input separator lines extend across the available terminal width

#### Scenario: Width unavailable
- **WHEN** terminal width is unavailable
- **THEN** the input separator lines render with a stable fallback length
