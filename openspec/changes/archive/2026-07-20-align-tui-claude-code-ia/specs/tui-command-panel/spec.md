## MODIFIED Requirements

### Requirement: Command registration system

The system SHALL provide a command registry that maps command names to descriptions and handler functions. For progressive Claude Code–style alignment, the registry MUST include the **required alignment command set** with real behavior (not “coming soon” stubs for these names).

Required alignment commands:

`/help`, `/clear`, `/compact`, `/model`, `/models`, `/status`, `/context`, `/cost`, `/permissions`, `/resume`, `/branch`, `/rewind`, `/theme`, `/session`, `/quit`, `/exit`

Other registered names (for example `/diff`, `/config`, `/review`, `/doctor`, `/export`, `/skills`, `/feedback`) MAY remain listed as stubs; this package MUST NOT claim full product behavior for stubs and MUST NOT require Claude’s full command catalog as completeness criteria.

#### Scenario: Command registry contains required alignment commands

- **WHEN** the command registry is initialized
- **THEN** it contains the required alignment command set listed above
- **AND** those commands have real handlers (not empty product stubs)

#### Scenario: Command handlers are invocable

- **WHEN** a registered required command is selected and confirmed
- **THEN** the corresponding handler function is called with the provided arguments

#### Scenario: Stubs are not over-claimed

- **WHEN** a stub command remains in the registry
- **THEN** progressive-alignment acceptance does not require full product behavior for that stub

### Requirement: Command panel expands to 20+ commands

The system MAY include a broad built-in command list organized by category for discovery. Matching Claude Code’s entire command set is NOT a package completeness MUST. Categories MAY be shown when useful.

#### Scenario: Categories visible when grouped

- **WHEN** the command panel is displayed and commands are grouped
- **THEN** grouping MAY use categories such as Session, Information, Configuration, Development

#### Scenario: Required set is discoverable without full catalog mandate

- **WHEN** all commands are listed
- **THEN** the required alignment command set is present and discoverable
- **AND** absence of a Claude-only or stub-only command is not a package failure

### Requirement: Command panel trigger and filter

The system SHALL display the command panel when the user types `/` at the start of input, filtering commands in real-time as the user continues typing (name-priority ranking, then description, is acceptable; cloning Claude’s full fuzzy engine is not required).

#### Scenario: Slash triggers command panel

- **WHEN** the user types `/` as the first character in the input
- **THEN** the command panel appears
- **AND** commands are listed (unfiltered)
- **AND** the first command is selected by default

#### Scenario: Filtering commands

- **WHEN** the user types `/mod` in the input
- **THEN** only commands matching "mod" in name or description are shown
- **AND** the list updates on each keystroke

### Requirement: Command keyboard navigation

The system SHALL support up/down arrow keys to navigate the command list, Enter to select (fill when `takesArgs` or run immediately otherwise), and Escape to close without cancelling a running turn solely via slash Esc.

#### Scenario: Arrow key navigation

- **WHEN** the command panel is open and the user presses Up or Down
- **THEN** the selection moves within the filtered list

#### Scenario: Enter selects command

- **WHEN** a command is selected and the user presses Enter
- **THEN** the command is filled or executed according to its handler contract

#### Scenario: Escape closes panel

- **WHEN** the command panel is open and the user presses Escape
- **THEN** the panel closes / slash mode ends
- **AND** a running turn is not cancelled by that Escape alone
