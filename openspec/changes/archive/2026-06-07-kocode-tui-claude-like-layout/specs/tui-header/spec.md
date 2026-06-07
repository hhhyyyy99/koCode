## MODIFIED Requirements

### Requirement: App header displays branding and context

The TUI SHALL render a header section containing:
- The koCode version string
- The current model name and provider
- The current model context window when available
- The current working directory

The header SHALL ignore small logo/icon artwork for this layout and SHALL NOT require an ASCII-art logo.

#### Scenario: Header shows on startup

- **WHEN** the TUI application starts
- **THEN** a header is displayed with version, model name, context information when available, and working directory
- **AND** no small icon or ASCII-art logo is required

#### Scenario: Header remains stable during conversation

- **WHEN** the user sends messages and receives responses
- **THEN** the header continues to display the current version, model information, and working directory without adding logo artwork

### Requirement: Header information hierarchy

The system SHALL render the Header with a compact Claude-like information hierarchy in welcome mode and a compact two-line mode during active conversation.

#### Scenario: Header in welcome mode
- **WHEN** no conversation has started (events.length === 0)
- **THEN** the Header renders `koCode v<version>` as the primary line
- **AND** model info (`provider/model · context window` when available) appears below or adjacent according to terminal width
- **AND** current working directory appears as the final dimmed context line
- **AND** ASCII logo artwork is omitted

#### Scenario: Header during active conversation
- **WHEN** at least one turn exists in the conversation
- **THEN** the Header renders without logo artwork
- **AND** shows koCode version + model info on one line
- **AND** working directory on the second line
