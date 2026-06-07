## ADDED Requirements

### Requirement: Description matches are fallback results
The TUI SHALL show description-only slash command matches only when the current query has no command-name matches.

#### Scenario: Exact command name suppresses description-only matches
- **WHEN** the user types `/context`
- **THEN** `/context` appears in the command panel results
- **AND** `/compact` does not appear only because its description contains `context`

#### Scenario: Command-name prefix suppresses description-only matches
- **WHEN** the user types `/con`
- **THEN** command-name matches for `con` appear in the command panel results
- **AND** commands that only match `con` through their descriptions do not appear

#### Scenario: Description fallback remains available
- **WHEN** the user types a term that does not match any command name
- **AND** the term matches one or more command descriptions
- **THEN** matching commands appear in the command panel results
