# tui-turn-completion-marker Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Turn completion marker
The system SHALL display a completion marker after each turn finishes, showing `✻ <verb> for <duration>` where verb is a randomly selected fun verb based on duration.

#### Scenario: Short task completion
- **WHEN** a turn completes in under 5 seconds
- **THEN** the marker displays `✻ Cooked for <Ns>` with a cooking-related verb

#### Scenario: Medium task completion
- **WHEN** a turn completes between 5 and 20 seconds
- **THEN** the marker displays `✻ Baked for <Ns>` with a baking-related verb

#### Scenario: Long task completion
- **WHEN** a turn completes in over 20 seconds
- **THEN** the marker displays `✻ Crunched for <Ns>` with a compute-related verb

### Requirement: Duration tracking in Turn model
The system SHALL record turn start and end timestamps to compute duration for the completion marker.

#### Scenario: Turn duration recorded
- **WHEN** a turn_end event is processed
- **THEN** the Turn's `completedAt` timestamp is set
- **AND** `durationMs` is computed from turn_start to turn_end

