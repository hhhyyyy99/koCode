# tui-input-prefix-system Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Shell execution prefix (!)
The system SHALL support `!` prefix for direct shell execution without AI processing.

#### Scenario: Direct shell command
- **WHEN** user types `!ls -la` and presses Enter
- **THEN** the command is executed directly via the configured shell
- **AND** the output is displayed as a tool card (Bash tool format)
- **AND** no AI turn is started

#### Scenario: Shell command with no output
- **WHEN** user types `!mkdir -p /tmp/test` and presses Enter
- **THEN** the command executes and shows `⎿ Done` or empty output

### Requirement: Memory prefix (#)
The system SHALL support `#` prefix for quick memory addition to project CLAUDE.md.

#### Scenario: Add memory
- **WHEN** user types `# Use 2-space indentation` and presses Enter
- **THEN** the text is appended to `.claude/CLAUDE.local.md` (or `CLAUDE.md` if local doesn't exist)
- **AND** a confirmation message is shown

### Requirement: File reference prefix (@)
The system SHALL support `@` prefix for referencing files with interactive completion while typing; submit-time routing of an input-start `@path` message SHALL remain the Tier-1 text route.

#### Scenario: File reference with autocomplete
- **WHEN** the user types `@` and completes a path via the file picker, then submits
- **THEN** the `@` path reference is included in the user message sent to the AI
- **AND** the AI can see the file path as context

#### Scenario: Manually typed reference still works
- **WHEN** user types `@./src/api/` followed by a message and presses Enter after the picker is closed
- **THEN** the `@` path reference is included in the user message sent to the AI
- **AND** submit routing behaves exactly as before the picker existed

### Requirement: Prefix routing in input
The system SHALL parse and route input based on the first character prefix, falling back to AI conversation when no prefix matches.

#### Scenario: No prefix defaults to AI
- **WHEN** user types a message without `!`, `#`, `@`, or `/` prefix
- **THEN** the message is sent to the AI agent as a normal turn

