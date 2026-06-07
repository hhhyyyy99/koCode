## MODIFIED Requirements

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

### Requirement: Input prompt symbol

The system SHALL render `❯` as the input prompt symbol in green bold at the start of the prompt row inside the separator frame.

#### Scenario: Prompt display
- **WHEN** input area is rendered in normal state
- **THEN** `❯` is displayed as the leftmost prompt marker in green bold
- **AND** the text input follows immediately after the prompt marker
- **AND** the prompt row remains visually bounded by the horizontal separator above and below

## ADDED Requirements

### Requirement: Terminal-width input separators

The system SHALL compute input separator length from the current terminal width when available and SHALL use a stable fallback width for tests or non-TTY rendering.

#### Scenario: Wide terminal separators
- **WHEN** the TUI is rendered in a terminal wider than the fallback width
- **THEN** the input separator lines extend across the available terminal width

#### Scenario: Width unavailable
- **WHEN** terminal width is unavailable
- **THEN** the input separator lines render with a stable fallback length
