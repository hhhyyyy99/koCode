# tui-command-panel Specification

## Purpose
TBD - created by archiving change kocode-tui-rewrite. Update Purpose after archive.
## Requirements
### Requirement: Slash command panel triggered by / input

The TUI SHALL display an interactive unbordered command completion list when the user types `/` in the input box. The list SHALL appear below the input area separator and SHALL list available commands with aligned descriptions.

#### Scenario: Command panel opens on /

- **WHEN** user types `/` at the beginning of the input
- **THEN** the command panel appears below the input area separator showing all available commands
- **AND** the panel is not enclosed in a rounded or rectangular border
- **AND** the status bar does not appear between the input area separator and the command panel

#### Scenario: Real-time filtering

- **WHEN** user continues typing after `/`
- **THEN** the command panel filters the list to show only commands whose names or descriptions match the input

#### Scenario: Keyboard navigation

- **WHEN** the command panel is open
- **THEN** `↑` and `↓` keys move the selection highlight, `Enter` fills or runs the selected command according to command metadata, and `Escape` closes the panel

#### Scenario: Panel closes on non-command input

- **WHEN** user deletes the `/` character or types text that does not start with `/`
- **THEN** the command panel closes

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

### Requirement: Command panel expands to 20+ commands

The system MAY include a broad built-in command list organized by category for discovery. Matching Claude Code’s entire command set is NOT a package completeness MUST. Categories MAY be shown when useful.

#### Scenario: Categories visible when grouped

- **WHEN** the command panel is displayed and commands are grouped
- **THEN** grouping MAY use categories such as Session, Information, Configuration, Development

#### Scenario: Required set is discoverable without full catalog mandate

- **WHEN** all commands are listed
- **THEN** the required alignment command set is present and discoverable
- **AND** absence of a Claude-only or stub-only command is not a package failure

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

### Requirement: Command completion cursor placement
The command panel SHALL place the input cursor at the intended edit position whenever a command is completed or filled into the input.

#### Scenario: Tab completion places cursor at end
- **WHEN** the command panel is open and the user presses Tab on a matching command
- **THEN** the input is replaced with the completed command text
- **AND** the cursor is placed at the end of the completed command text
- **AND** the next printable character is appended after the completed command text

#### Scenario: Argument command fill places cursor after trailing space
- **WHEN** the user selects a command that requires arguments
- **THEN** the command name and one trailing space are filled into the input
- **AND** the command panel closes
- **AND** the cursor is placed after the trailing space so argument typing begins in the argument position

#### Scenario: Exact command execution does not leave stale cursor
- **WHEN** the user submits an exact slash command that executes immediately
- **THEN** the input buffer is cleared
- **AND** any subsequent typed input starts from an empty buffer at cursor offset zero

### Requirement: Claude-like command row formatting

The command panel SHALL format each visible command row using stable text columns: selection marker, command name, description, and optional source metadata.

#### Scenario: Command description alignment
- **WHEN** the command panel displays multiple commands
- **THEN** command names start in the same column
- **AND** descriptions start in the same column

#### Scenario: Source metadata display
- **WHEN** a command has source or scope metadata such as `project`
- **THEN** the panel displays the metadata as a dimmed continuation line formatted like `(project)`
- **AND** the continuation line is indented to the description column

#### Scenario: Long description wrapping
- **WHEN** a command description exceeds the available width
- **THEN** wrapped description text remains aligned with the description column

### Requirement: Tab completion follows highlighted command
The TUI SHALL complete the slash command currently highlighted in the command panel when the user presses Tab.

#### Scenario: Tab completes selected non-first command
- **GIVEN** the slash command panel is open with multiple matching commands
- **AND** the highlighted command is not the first visible or filtered command
- **WHEN** the user presses Tab
- **THEN** the input is replaced with the highlighted command text
- **AND** the cursor is placed at the end of the completed command text
- **AND** the first filtered command is not used unless it is also highlighted

#### Scenario: Tab completes selected argument command
- **GIVEN** the slash command panel is open
- **AND** the highlighted command requires arguments
- **WHEN** the user presses Tab
- **THEN** the input is replaced with the command name followed by one trailing space
- **AND** the cursor is placed after the trailing space

### Requirement: Command filter ranks name matches before description matches
The TUI SHALL rank slash command filter results by match relevance so command-name matches appear before description-only matches.

#### Scenario: Exact command name outranks description synonym
- **WHEN** the user types `/exit`
- **THEN** `/exit` appears before `/quit` in the command panel results
- **AND** `/exit` is selected by default

#### Scenario: Description matches remain available
- **WHEN** the user types a term that matches a command description but not its command name
- **THEN** matching commands remain visible in the command panel

#### Scenario: Empty query preserves default command order
- **WHEN** the user types only `/`
- **THEN** the command panel shows commands in the default registry order

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

### Requirement: Slash panel updates while deleting completed input
The command panel SHALL remain synchronized with the input while the user deletes slash command text, including text inserted by completion.

#### Scenario: Deleting completed command updates filter
- **WHEN** the command panel is open after completing `/help`
- **AND** the user presses the erase key
- **THEN** the input changes to `/hel`
- **AND** the command panel remains open with filtering based on `/hel`

#### Scenario: Deleting slash closes panel when prefix removed
- **WHEN** the command panel is open with input `/`
- **AND** the user presses the erase key
- **THEN** the input becomes empty
- **AND** the command panel closes
- **AND** focus returns to normal input mode

