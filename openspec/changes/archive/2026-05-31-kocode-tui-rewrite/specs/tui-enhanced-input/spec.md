## ADDED Requirements

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
