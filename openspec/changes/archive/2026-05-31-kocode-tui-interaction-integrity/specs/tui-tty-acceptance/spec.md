## ADDED Requirements

### Requirement: Core interaction loop has real TTY acceptance
The change SHALL include a real terminal acceptance path for the core TUI loop.

#### Scenario: Golden path acceptance
- **WHEN** validation is run in a real TTY or documented manual TTY session
- **THEN** it exercises input, running state, tool call rendering, permission resolution, tool expansion, completion marker, and next input without focus conflicts

### Requirement: Acceptance result is recorded
The change SHALL record the command or manual path used for real TTY validation and the observed result.

#### Scenario: Task records TTY validation
- **WHEN** the implementation is ready for acceptance
- **THEN** `tasks.md` includes a completed item naming the TTY validation path and result

### Requirement: Future TUI alignment depends on interaction acceptance
Future visual or feature alignment work SHALL not be considered accepted when it bypasses the core interaction loop validation.

#### Scenario: Visual change requires TTY check
- **WHEN** a later TUI alignment task changes input, focus, tools, permissions, or status rendering
- **THEN** that task includes real TTY validation for the affected interaction path
