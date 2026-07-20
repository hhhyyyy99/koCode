## MODIFIED Requirements

### Requirement: Multi-line input via Alt+Enter

The input box SHALL support multi-line input where newline-without-submit is always available, and `Enter` alone submits the message when focus allows submit.

- **MUST** keep existing **Alt/Option+Enter** and **Ctrl+Enter** (and existing Ctrl+J-style path if still present) as newline bindings.
- **SHOULD** support **Shift+Enter** as the primary Claude-aligned newline binding where the terminal delivers it.
- Working newline bindings MUST NOT be dropped solely to chase a single binding.

#### Scenario: Enter submits

- **WHEN** user presses Enter without a newline-modifier held and focus allows submit
- **THEN** the current input content is submitted

#### Scenario: Alt+Enter inserts newline

- **WHEN** user presses Alt+Enter (or Option+Enter)
- **THEN** a newline character is inserted at the cursor position
- **AND** the input is not submitted

#### Scenario: Ctrl+Enter inserts newline

- **WHEN** user presses Ctrl+Enter while focused in the input
- **THEN** a newline character is inserted at the cursor position
- **AND** the input is not submitted

#### Scenario: Shift+Enter inserts newline when delivered

- **WHEN** the terminal delivers Shift+Enter to the TUI input
- **THEN** a newline SHOULD be inserted without submit

### Requirement: Multi-line input

The system SHALL support multi-line input via Alt+Enter, Ctrl+Enter, Ctrl+J (if present), and SHOULD via Shift+Enter.

#### Scenario: Alt+Enter inserts newline

- **WHEN** user presses Alt+Enter while focused in the input
- **THEN** a newline character is inserted at cursor position
- **AND** the input area grows to show all lines

#### Scenario: Ctrl+J inserts newline

- **WHEN** user presses Ctrl+J while focused in the input and that binding is present
- **THEN** a newline character is inserted at cursor position

## ADDED Requirements

### Requirement: Esc cancels a running turn from text input

While a turn is `running` and keyboard focus is text-input (`input` / non-modal, not slash/history/transcript-block/permission/other modal), Escape SHALL call existing `AgentSession.cancel()` leading to `turn_cancelled`. Partial work already on the timeline remains visible. Unsent draft text MUST be preserved.

#### Scenario: Esc cancels running turn

- **WHEN** a turn is running
- **AND** focus is text-input with no higher Esc owner
- **AND** the user presses Escape
- **THEN** the session cancel path runs
- **AND** partial assistant/tool/thinking content already rendered remains on the timeline
- **AND** any unsent draft is preserved

#### Scenario: Esc does not cancel under higher owners

- **WHEN** permission, slash, history-search, or another blocking modal owns focus
- **AND** the user presses Escape
- **THEN** that surface handles Escape
- **AND** the running turn is not cancelled solely by that Escape

#### Scenario: Esc in transcript-block returns to input

- **WHEN** focus mode is expandable transcript-block
- **AND** the user presses Escape
- **THEN** focus returns to input
- **AND** the running turn is not cancelled by that Escape

### Requirement: Cancel-turn binding is Esc not Ctrl+C

This package MUST treat **Esc** (under the priority rules above) as the cancel-running-turn gesture. Process-level Ctrl+C MAY remain application exit (`exitOnCtrlC`). Explicit exit remains `/quit` / `/exit`. This package MUST NOT redefine Ctrl+C as the primary cancel-turn gesture.

#### Scenario: Package cancel-turn is Esc

- **WHEN** progressive-alignment acceptance for interrupt is evaluated
- **THEN** Esc under text-input + running is the cancel-turn path
- **AND** Ctrl+C is not required to cancel the turn

#### Scenario: Explicit exit remains slash commands

- **WHEN** the user wants to leave the app intentionally via product command
- **THEN** `/quit` or `/exit` remains available
