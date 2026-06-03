# tui-enhanced-status Specification

## Purpose
TBD - created by archiving change kocode-tui-rewrite. Update Purpose after archive.
## Requirements
### Requirement: Status bar shows session information

The status bar SHALL display:
- The current model (provider/id)
- Token usage (input/output counts)
- Running/thinking indicator when agent is active
- An abbreviated session ID

#### Scenario: Status bar showing idle state

- **WHEN** the agent is not running
- **THEN** the status bar displays model name, last known token usage, and session ID

#### Scenario: Status bar showing running state

- **WHEN** the agent is processing a request
- **THEN** the status bar displays a running indicator (e.g., "⚡ thinking") with a distinct color

#### Scenario: Token usage updates after turn

- **WHEN** a `turn_end` event is received
- **THEN** the status bar updates to show the latest input and output token counts

