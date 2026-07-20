## MODIFIED Requirements

### Requirement: Dialog title matches permission category

The TUI SHALL render permission dialog titles from the permission category without misleading fallbacks. Exact English strings may vary under fidelity A; category honesty MUST NOT.

#### Scenario: Write permission title

- **WHEN** the permission request category is file creation / write
- **THEN** the dialog title communicates file creation/write intent (not bash or unknown)

#### Scenario: Edit permission title

- **WHEN** the permission request category is file edit
- **THEN** the dialog title communicates edit intent

#### Scenario: Bash permission title

- **WHEN** the permission request category is command execution
- **THEN** the dialog title communicates bash/command intent

#### Scenario: Unknown permission title

- **WHEN** the permission request category is unknown or generic
- **THEN** the dialog title is neutral and does not say `Create file` or otherwise claim file creation

### Requirement: Read-only tools do not show mutation wording

The TUI SHALL NOT show file mutation wording for read-only tools.

#### Scenario: ls does not show create file

- **WHEN** a read-only `ls` action is displayed in the TUI
- **THEN** no permission dialog says `Create file` for that action

### Requirement: Allow-all wording matches category

The TUI SHALL render allow-all (`approve_all`) option text that matches the permission category and **session-scoped category** semantics of the current engine.

- Effect of `approve_all`: for the rest of **this session**, suppress further prompts for the same permission category (`edit` / `write` / `bash` / `unknown` as classified by the agent).
- Copy MUST match that semantics.
- Copy MUST NOT imply cross-session persistence, project-level allow-lists, or bash per-command permanent allow for this package.

#### Scenario: Bash allow-all wording is session-scoped

- **WHEN** the permission request category is command execution
- **THEN** the allow-all option describes broader allow for bash/commands for the rest of this session (or equivalent honest session+category language)
- **AND** does NOT claim “always allow in this project” (or equivalent project-permanent wording)

#### Scenario: File mutation allow-all wording

- **WHEN** the permission request category is file creation or file edit
- **THEN** the allow-all option names file edit/write scope for the session, not read-only scope
- **AND** does not claim cross-session project persistence as a product guarantee of this package

#### Scenario: Unknown allow-all wording

- **WHEN** the permission request category is unknown
- **THEN** the allow-all option avoids claiming the action is a file edit or file creation

## ADDED Requirements

### Requirement: Three-way permission actions

The permission dialog SHALL expose three options mapped to existing `resolvePermission` actions only:

| Intent | Action |
| --- | --- |
| Allow once (this tool call) | `approve` |
| Allow broader (session-scoped category) | `approve_all` |
| Deny | `deny` |

Modes remain `default | accept_edits | auto` only for this package.

#### Scenario: Allow once does not broaden session category

- **WHEN** the user chooses allow once
- **THEN** the TUI resolves `approve`
- **AND** the session category is not broadened solely by that choice

#### Scenario: Allow broader uses approve_all

- **WHEN** the user chooses allow broader
- **THEN** the TUI resolves `approve_all`
- **AND** further prompts for the same category may be suppressed for the rest of the session by the existing engine

#### Scenario: Deny resolves deny

- **WHEN** the user chooses deny
- **THEN** the TUI resolves `deny`

### Requirement: Permission focus monopoly and Esc deny

While the permission dialog is open, focus mode `permission` SHALL own Up/Down, Enter, digit `1`–`3`, and Escape. Escape MUST resolve as `deny` (complete the resolve loop; no silent dismiss without answer). Input, slash, and global shortcuts (including `ctrl+o`) MUST NOT steal those keys while permission focus is active.

#### Scenario: Esc denies

- **WHEN** the permission dialog is focused and the user presses Escape
- **THEN** the request is resolved as `deny`
- **AND** global double-Escape rewind does not run

#### Scenario: Keyboard monopoly while open

- **WHEN** the permission dialog is open
- **AND** the user presses Up, Down, Enter, or 1–3
- **THEN** those keys are handled by the permission dialog only

### Requirement: Denial feeds the model as an error tool result

On deny (including Esc), the TUI SHALL call `resolvePermission(requestId, "deny")`. Denial MUST become an error tool result visible to the model (for example `"Permission denied by user"`) so the tool loop continues rather than silently stopping. Emitting `permission_response` is NOT a MUST for this package. Permission UI remains a blocking overlay and MUST NOT be modeled as a Turn timeline row under progressive alignment.

#### Scenario: Deny produces error tool result path

- **WHEN** the user denies a permission request
- **THEN** the agent path surfaces an error tool result to the model
- **AND** the tool loop does not silent-stop without feedback

#### Scenario: Permission is overlay not timeline row

- **WHEN** a permission request is active
- **THEN** it is presented as a blocking overlay / dialog
- **AND** is not required to appear as a `useTurns` timeline item

### Requirement: Permission dialog information structure

The dialog MUST show: (i) category/title for bash · edit · write · unknown, (ii) key target (path / command / tool name), (iii) three options with locked semantics, (iv) keyboard hint (Esc / Enter at minimum). Edit/write SHOULD show a content preview that is not a raw full tool-envelope JSON dump.

#### Scenario: Dialog shows category target options and hints

- **WHEN** a gated tool triggers `permission_request` in `default` mode
- **THEN** the dialog presents category/title, key target, three options, and keyboard hints
- **AND** focus mode is `permission`
