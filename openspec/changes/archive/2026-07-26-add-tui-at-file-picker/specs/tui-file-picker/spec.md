## ADDED Requirements

### Requirement: `@` token opens file picker
The TUI SHALL open an interactive file candidate panel when the token containing the cursor starts with `@` and is at input start or preceded by whitespace.

#### Scenario: Picker opens at input start
- **WHEN** the user types `@` into an empty input
- **THEN** a file picker panel opens below the input listing entries of the session cwd

#### Scenario: Picker opens mid-sentence
- **WHEN** the user types `fix @` after existing text and a space
- **THEN** the file picker panel opens for the `@` token at the cursor

#### Scenario: No picker inside a word
- **WHEN** the user types `a@b` with no whitespace before `@`
- **THEN** the file picker does not open

### Requirement: Fragment filtering and ranking
The TUI SHALL filter candidates by the fragment typed after `@`, listing one directory level per fragment, ranking name-prefix matches before contains matches and directories before files within a tier.

#### Scenario: Fragment filters current level
- **GIVEN** the cwd contains `packages/` and `package.json`
- **WHEN** the user types `@pack`
- **THEN** both `packages/` and `package.json` are listed
- **AND** `packages/` is ranked before `package.json`

#### Scenario: Directory fragment lists that directory
- **WHEN** the user types `@packages/ko-`
- **THEN** candidates come from listing `packages/` filtered by the `ko-` name fragment

#### Scenario: Noise directories are hidden
- **WHEN** candidates are computed at any level
- **THEN** `node_modules`, `.git`, and `dist` entries are excluded

#### Scenario: Dotfiles require a dot fragment
- **WHEN** the name fragment does not start with `.`
- **THEN** dotfile entries are excluded
- **WHEN** the name fragment starts with `.`
- **THEN** dotfile entries are included

#### Scenario: Escaping the cwd yields no candidates
- **WHEN** the fragment resolves outside the session cwd (for example `@../../` beyond root or an absolute path)
- **THEN** the panel shows no matching files

### Requirement: Picker key ownership and insertion
While the file picker is open the TUI SHALL route Up/Down to selection movement and Tab/Enter to inserting the highlighted candidate into the input at the `@` token; Enter SHALL NOT submit the input while the picker is open.

#### Scenario: Insert a file
- **GIVEN** the picker is open with a file highlighted
- **WHEN** the user presses Tab or Enter
- **THEN** the fragment is replaced with the file path followed by one space
- **AND** the cursor is placed after the space
- **AND** the picker closes

#### Scenario: Descend into a directory
- **GIVEN** the picker is open with a directory highlighted
- **WHEN** the user presses Tab or Enter
- **THEN** the fragment is replaced with the directory path ending in `/`
- **AND** the picker remains open listing that directory

#### Scenario: Enter does not submit while picker open
- **GIVEN** the picker is open
- **WHEN** the user presses Enter
- **THEN** no message is submitted and no agent turn starts

### Requirement: Picker dismissal
The TUI SHALL close the file picker on Escape keeping the typed text, and whenever the `@` token no longer contains the cursor.

#### Scenario: Escape keeps text
- **GIVEN** the picker is open with `@src` typed
- **WHEN** the user presses Escape
- **THEN** the picker closes
- **AND** the input still contains `@src`
- **AND** no turn is cancelled and no rewind dialog opens

#### Scenario: Token removal closes picker
- **GIVEN** the picker is open
- **WHEN** the user deletes the `@` or types whitespace ending the token or moves the cursor out of the token
- **THEN** the picker closes and input focus returns to normal editing
