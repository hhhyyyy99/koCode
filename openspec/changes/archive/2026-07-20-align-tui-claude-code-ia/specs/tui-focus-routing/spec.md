## ADDED Requirements

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

The TUI SHALL route expandable transcript block navigation consistently with the active `unify-expandable-transcript-blocks` contract: when expandable-block focus is active, Up/Down (and existing nav) move among expandable keys; Ctrl+O toggles the focused block; modal/permission focus continues to block these global shortcuts.

#### Scenario: Modal blocks expandable shortcuts

- **WHEN** permission or another modal focus mode is active
- **THEN** Ctrl+O and expandable navigation do not steal keys from the modal
