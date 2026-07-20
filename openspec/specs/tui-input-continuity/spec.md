# tui-input-continuity Specification

## Purpose
TBD - created by archiving change kocode-tui-interaction-integrity. Update Purpose after archive.
## Requirements
### Requirement: Input remains visible during agent execution

The TUI SHALL keep the input prompt visible while an agent turn is running.

#### Scenario: Running turn keeps input surface

- **WHEN** the user submits a prompt and the agent turn enters running state
- **THEN** the input prompt remains rendered instead of being replaced by a thinking-only label

### Requirement: Draft text is preserved across running state changes

The TUI SHALL preserve unsent draft text when the running state changes, when a permission dialog opens, when a permission dialog closes, and when other modals open or close.

#### Scenario: Draft survives permission prompt

- **WHEN** the user has unsent draft text and a permission request appears
- **THEN** the draft text remains available after the permission request is approved or denied

#### Scenario: Draft survives running turn lifecycle

- **WHEN** the user has unsent draft text while a turn starts and later ends or is cancelled
- **THEN** the draft text remains available in the input buffer

### Requirement: Busy submit behavior is explicit

The TUI SHALL provide deterministic behavior when the user presses Enter while another agent turn is still running.

#### Scenario: Submit while busy

- **WHEN** the user presses Enter with non-empty input while an agent turn is running
- **THEN** the TUI rejects submission with a visible message (queueing MAY exist but is not required)
- **AND** the draft is not lost

