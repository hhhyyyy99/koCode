## MODIFIED Requirements

### Requirement: Status bar layout

The system SHALL render a persistent bottom StatusBar (footer) for **runtime / pressure** fields, distinct from the Header identity chrome and from `/status` / `/cost` / `/context` detail panels.

**StatusBar MUST** fields:

- permission mode (idle / mode signal)
- running / task state when a turn is active
- context **usage pressure** (percent or short used/window form — not only Header window capacity)
- shortcuts hint (may shorten by focus/state)

**StatusBar SHOULD** fields when width allows:

- abbreviated cumulative session cost
- git branch (if available)

Model short label is NOT required in the footer when Header already shows full model. Session id, full token in/out detail lines, PR badge, and custom statusline script engines are NOT footer MUSTs.

#### Scenario: Idle footer shows mode, context pressure, and shortcuts

- **WHEN** the TUI is idle in normal conversation mode
- **THEN** the StatusBar shows the current permission mode
- **AND** shows context usage pressure
- **AND** shows a shortcuts hint

#### Scenario: Status bar when AI is running

- **WHEN** a turn is in running / streaming state
- **THEN** the StatusBar retains a visible running / task signal
- **AND** does not silently drop both running and mode at once under width pressure

#### Scenario: Deep detail stays out of footer MUST

- **WHEN** the user needs session id, full token lines, or settings dump
- **THEN** those fields are available via `/status` / `/cost` / `/context` (or peers)
- **AND** are not required as StatusBar MUST content

### Requirement: Shortcut hint display

The system SHALL display the most relevant keyboard shortcuts based on current state, and MAY compress the hint under narrow-terminal policy.

#### Scenario: Normal mode shortcuts

- **WHEN** no special mode is active
- **THEN** the StatusBar shows a shortcuts hint (full or compressed form)

#### Scenario: Expandable block focus shortcuts

- **WHEN** expandable transcript block focus is active and a tool or thinking block is focused
- **THEN** the shortcut hint reflects expand/collapse (`ctrl+o`) rather than unrelated global hints when space allows

## ADDED Requirements

### Requirement: Narrow-terminal StatusBar drop priority

When terminal width is insufficient, the StatusBar SHALL drop or compress fields in this order (first → last):

1. git branch (SHOULD)
2. cost (SHOULD)
3. context% long form → short `%` / compact pressure cue
4. shortcuts long copy → minimal hint / `?`
5. mode long label → short code (copy not glyph-cloned)
6. running indicator — compress last; MUST NOT silently drop both running and mode

Header MAY truncate cwd tail / model id as needed and MUST NOT steal footer priority slots by relocating Header identity fields into the footer.

#### Scenario: Narrow terminal drops SHOULD fields first

- **WHEN** terminal width cannot fit the full StatusBar field package
- **THEN** git branch and cost are dropped or compressed before MUST fields
- **AND** a running turn still exposes a running or mode signal

#### Scenario: Header truncation does not reorder footer priority

- **WHEN** Header content is long
- **THEN** Header truncates its own fields as needed
- **AND** footer drop priority remains as specified above

### Requirement: StatusBar data sources without new agent events

StatusBar fields SHALL be derived from existing session pull APIs (permission mode, running state, model, cwd, usage/context/cost stats as needed). Git branch SHOULD use a TUI-local git read when available. This package MUST NOT require new `AgentSessionEvent` types solely for footer density.

#### Scenario: Footer updates from session pull state

- **WHEN** permission mode, running state, or usage/context stats change through existing session APIs
- **THEN** the StatusBar can reflect those values without a new agent push event type

#### Scenario: Git branch optional local read

- **WHEN** git branch is shown in the footer
- **THEN** it may come from a TUI-local git read
- **AND** absence of an agent git event is not a defect
