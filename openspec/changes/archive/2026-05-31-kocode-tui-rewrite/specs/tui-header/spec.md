## ADDED Requirements

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
