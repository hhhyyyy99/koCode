## MODIFIED Requirements

### Requirement: Status bar shows session information

The status surface SHALL place dense runtime fields on the StatusBar footer as defined by `tui-status-bar`, identity fields on the Header, and deep session detail in `/status` / `/cost` / `/context` panels. This requirement supersedes prior wording that forced the footer to MUST-display all of: full model id, token input/output detail lines, and abbreviated session id together.

The footer SHALL follow the `tui-status-bar` field package:

- MUST: permission mode, running/task state, context usage pressure, shortcuts hint
- SHOULD: abbreviated session cost, git branch
- MUST NOT require: session id, full token in/out lines, or model duplication when Header already shows model

#### Scenario: Status bar showing idle state

- **WHEN** the agent is not running
- **THEN** the StatusBar displays permission mode, context usage pressure, and shortcuts
- **AND** MAY display cost and git branch when width allows
- **AND** does NOT require session id or full token in/out lines in the footer

#### Scenario: Status bar showing running state

- **WHEN** the agent is processing a request
- **THEN** the StatusBar displays a running / task indicator
- **AND** retains mode or running visibility under narrow-terminal compression rules from `tui-status-bar`

#### Scenario: Usage pressure updates after turn

- **WHEN** a turn ends and session usage/context stats update through existing APIs
- **THEN** the StatusBar context pressure (and cost if shown) can update
- **AND** no new agent push event is required solely for that update

#### Scenario: Session id and token detail live in panels

- **WHEN** the user opens `/status`, `/cost`, or `/context`
- **THEN** deep fields such as session id and token detail MAY be shown there
- **AND** those fields are not StatusBar MUST content under this package
