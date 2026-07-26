## ADDED Requirements

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
