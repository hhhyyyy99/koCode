## ADDED Requirements

### Requirement: Cost tracking command
The system SHALL display session cost and token usage statistics when `/cost` is invoked.

#### Scenario: Cost command output
- **WHEN** user runs `/cost`
- **THEN** the output displays:
  - Total cost in USD (e.g., `$0.53`)
  - Total API duration (e.g., `14s`)
  - Total wall duration (e.g., `5m 20s`)
  - Total code changes (lines added / lines removed)

#### Scenario: Usage by model breakdown
- **WHEN** `/cost` is run with multiple models used in session
- **THEN** each model shows its own breakdown:
  - Input tokens
  - Output tokens
  - Cache read tokens
  - Cache write tokens
  - Cost

### Requirement: Token statistics tracking
The system SHALL accumulate token usage statistics internally as events flow through the session.

#### Scenario: Token stats accumulated
- **WHEN** a turn completes with usage data in the response
- **THEN** input/output/cache tokens are added to the running session totals
- **AND** the stats are accessible via `session.getUsage()` method
