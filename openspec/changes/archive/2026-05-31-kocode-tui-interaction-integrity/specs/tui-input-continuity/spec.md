## ADDED Requirements

### Requirement: Input remains visible during agent execution
The TUI SHALL keep the input prompt visible while an agent turn is running.

#### Scenario: Running turn keeps input surface
- **WHEN** the user submits a prompt and the agent turn enters running state
- **THEN** the input prompt remains rendered instead of being replaced by a thinking-only label

### Requirement: Draft text is preserved across running state changes
The TUI SHALL preserve unsent draft text when the running state changes, when a permission dialog opens, and when a permission dialog closes.

#### Scenario: Draft survives permission prompt
- **WHEN** the user has unsent draft text and a permission request appears
- **THEN** the draft text remains available after the permission request is approved or denied

### Requirement: Busy submit behavior is explicit
The TUI SHALL provide deterministic behavior when the user presses Enter while another agent turn is still running.

#### Scenario: Submit while busy
- **WHEN** the user presses Enter with non-empty input while an agent turn is running
- **THEN** the TUI either queues the prompt or rejects submission with a visible message, without losing the draft
