## MODIFIED Requirements

### Requirement: Welcome screen display
The system SHALL use the compact header as the startup identity surface when no conversation events exist, replacing the previous separate welcome body for this Claude-like layout mode.

#### Scenario: First launch
- **WHEN** the TUI starts with zero events
- **THEN** the header displays the koCode version number (vX.Y.Z)
- **AND** the header shows current model info with context window
- **AND** the header shows current working directory
- **AND** no separate koCode ASCII logo body is required
- **AND** the input area remains active below

#### Scenario: After /clear
- **WHEN** the user runs `/clear` to clear conversation
- **THEN** the compact header remains the startup identity surface
- **AND** the input area remains active below

### Requirement: Welcome screen tips
The system SHALL NOT require a separate getting-started tips block in the empty conversation body for this Claude-like layout mode.

#### Scenario: Tips omitted
- **WHEN** the startup layout is shown
- **THEN** no separate tips block is required in the empty conversation body
- **AND** command discovery remains available through the `/` command panel
