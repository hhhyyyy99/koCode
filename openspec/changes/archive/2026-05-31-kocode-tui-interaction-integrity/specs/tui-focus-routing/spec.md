## ADDED Requirements

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
