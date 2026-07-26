# tui-focus-routing Specification

## Purpose
TBD - created by archiving change kocode-tui-interaction-integrity. Update Purpose after archive.
## Requirements
### Requirement: Single active focus mode
The TUI SHALL maintain one active focus mode for keyboard routing.

#### Scenario: Focus mode changes to slash panel
- **WHEN** the user types `/` at the start of input
- **THEN** the active focus mode becomes slash panel and slash navigation keys are routed only to slash command selection

### Requirement: Modal focus blocks background shortcuts
The TUI SHALL prevent background shortcuts from acting while a modal focus mode is active.

#### Scenario: Escape in permission modal
- **WHEN** a permission dialog is focused and the user presses Escape
- **THEN** the permission dialog handles Escape as denial or cancel and global double-Escape rewind does not run

### Requirement: Focus restoration after modal close
The TUI SHALL restore the previous usable focus mode after a modal closes.

#### Scenario: Status modal closes
- **WHEN** the user closes the status modal
- **THEN** keyboard focus returns to input unless another blocking focus mode is active

### Requirement: Escape priority across focus modes

When Escape is pressed, handlers SHALL apply in this order (first match wins):

1. Blocking modal open (`permission`, status/model/theme/session modal, `rewind-confirm`) → modal owns Esc (deny/close per that surface).
2. `slash` → dismiss command panel / leave slash mode; do not cancel turn.
3. `history-search` → dismiss history search.
4. Turn `running` + text-input focus → cancel turn via `session.cancel()`.
5. Else existing bare / double-Esc paths (for example empty idle → rewind confirm) remain as today.

Global shortcuts remain blocked while modal focus is active.

#### Scenario: Permission owns Escape

- **WHEN** a permission dialog is focused and the user presses Escape
- **THEN** the permission dialog handles Escape as denial
- **AND** running-turn cancel does not run for that keypress

#### Scenario: Slash owns Escape

- **WHEN** slash command panel focus is active and the user presses Escape
- **THEN** the command panel closes / slash mode ends
- **AND** a running turn is not cancelled by that keypress

#### Scenario: History search owns Escape

- **WHEN** history-search focus is active and the user presses Escape
- **THEN** history search dismisses
- **AND** a running turn is not cancelled by that keypress

#### Scenario: Running input cancels on Escape

- **WHEN** no higher Esc owner is active
- **AND** a turn is running under text-input focus
- **AND** the user presses Escape
- **THEN** the session cancel path runs

### Requirement: Transcript-block Escape returns to input

When expandable transcript block focus is active, Escape SHALL return focus to input and MUST NOT cancel the running turn by itself.

#### Scenario: Escape leaves transcript-block without cancel

- **WHEN** focus mode is transcript-block / expandable-block navigation
- **AND** the user presses Escape
- **THEN** focus returns to input
- **AND** the running turn is not cancelled solely by that Escape

### Requirement: Expandable transcript block focus routes navigation keys

The TUI SHALL route expandable transcript block navigation consistently with the `tui-expandable-transcript-blocks` contract: when expandable-block focus is active, Up/Down (and existing nav) move among expandable keys; Ctrl+O toggles the focused block; modal/permission focus continues to block these global shortcuts.

#### Scenario: Move focused expandable block

- **WHEN** expandable transcript block focus is active and the user presses Up, Down, or Tab
- **THEN** focus moves between expandable transcript blocks without modifying the input draft

#### Scenario: Escape returns to input from expandable blocks

- **WHEN** expandable transcript block focus is active and the user presses Escape
- **THEN** focus returns to the input mode

#### Scenario: Modal blocks expandable shortcuts

- **WHEN** permission or another modal focus mode is active
- **THEN** Ctrl+O and expandable navigation do not steal keys from the modal

### Requirement: File picker focus mode
The TUI SHALL provide a `file-picker` focus mode that owns Up/Down/Tab/Enter/Escape while the `@` file panel is open, keeps text-input editing active, and blocks global shortcuts.

#### Scenario: Picker owns navigation keys
- **GIVEN** the file picker is open
- **WHEN** the user presses Up, Down, Tab, Enter, or Escape
- **THEN** the key acts on the picker only
- **AND** slash navigation, rewind double-Escape, and Ctrl+O block toggles do not run

#### Scenario: Escape priority with picker open
- **WHEN** Escape is pressed while the file picker is open and no blocking modal is active
- **THEN** the picker closes and lower-priority Escape handlers (running-turn cancel, bare/double-Esc rewind) do not run in that keypress

#### Scenario: Blocking modal preempts picker
- **GIVEN** the file picker is open
- **WHEN** a permission request arrives
- **THEN** permission focus takes over
- **AND** after the permission resolves focus restores to normal input (not the stale picker)

