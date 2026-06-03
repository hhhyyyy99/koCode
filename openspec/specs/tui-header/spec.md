# tui-header Specification

## Purpose
TBD - created by archiving change kocode-tui-rewrite. Update Purpose after archive.
## Requirements
### Requirement: App header displays branding and context

The TUI SHALL render a header section containing:
- An ASCII-art koCode logo
- The koCode version string
- The current model name and provider
- The current working directory

The header SHALL be rendered exactly once and SHALL NOT re-render during the session.

#### Scenario: Header shows on startup

- **WHEN** the TUI application starts
- **THEN** a header is displayed with logo, version, model name, and working directory

#### Scenario: Header stays static during conversation

- **WHEN** the user sends messages and receives responses
- **THEN** the header content remains unchanged

### Requirement: Header information hierarchy
The system SHALL render the Header with a three-line information hierarchy in welcome mode and a compact two-line mode during active conversation.

#### Scenario: Header in welcome mode
- **WHEN** no conversation has started (events.length === 0)
- **THEN** the Header renders with ASCII logo on its own line
- **AND** "Welcome!" greeting on the second line
- **AND** model info (provider/id · context window) on the third line
- **AND** current working directory on the fourth line

#### Scenario: Header during active conversation
- **WHEN** at least one turn exists in the conversation
- **THEN** the Header renders without logo and greeting
- **AND** shows koCode version + model info on one line
- **AND** working directory on the second line

### Requirement: Model and session info display
The system SHALL display the current model, context window size, and working directory in the header.

#### Scenario: Model info format
- **WHEN** the header renders
- **THEN** model info SHALL be formatted as `<provider>/<model-id> · <N>k context`
- **AND** cwd is shown as the absolute path in dimmed text

