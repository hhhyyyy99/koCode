# tui-tool-card-realignment Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Tool card symbol and format

The system SHALL render each tool call as a single tool-card surface with a clear status vocabulary and human-readable title line. Status values SHALL be only `running`, `done`, and `error`, where `done` means successful completion. Exact Claude Code glyph/symbol parity (`●`, `✓`, `⎿`, etc.) is NOT a package MUST under fidelity A; status color or equivalent cues SHOULD remain.

#### Scenario: Running tool

- **WHEN** a tool call starts (`tool_start`)
- **THEN** the tool card shows the tool display name and key parameters
- **AND** status is `running` with an in-progress cue
- **AND** no success summary is shown

#### Scenario: Completed tool success

- **WHEN** a tool call completes successfully (`tool_end` without error)
- **THEN** the tool card status is `done`
- **AND** a one-line (or few-line) specialized collapsed summary is shown by default

#### Scenario: Completed tool error

- **WHEN** a tool call completes with error
- **THEN** the tool card status is `error`
- **AND** the collapsed summary surfaces an error gist rather than a success-shaped summary

#### Scenario: Status vocabulary only

- **WHEN** tool card state is modeled for the Turn / UI
- **THEN** only `running`, `done`, and `error` are used
- **AND** `done` is treated as the success cue (no required rename to `success`)

### Requirement: Line numbers in tool output

The system SHALL render detailed expanded tool output with line numbers for Edit and Write tools. Expanded detail is shown only when the card is expanded (not as the default collapsed view).

#### Scenario: Edit tool diff with line numbers

- **WHEN** an Edit tool result is expanded
- **THEN** each line of the diff displays its line number right-aligned
- **AND** removed lines are distinguishable from added lines (e.g. `-` / `+` with distinct styling)

#### Scenario: Write tool content with line numbers

- **WHEN** a Write tool result is expanded
- **THEN** the file content displays with line numbers

### Requirement: Output truncation with expand hint

The system SHALL keep tool cards collapsed by default, truncate long detail behind an expand affordance, and ensure the expand/collapse hint matches the real binding under the shared expandable transcript block model (`ctrl+o`).

#### Scenario: Tool output exceeds threshold

- **WHEN** expanded or expandable tool detail exceeds the visible threshold in collapsed state
- **THEN** the default view remains a short summary (not the full body)
- **AND** an overflow / expand hint is available

#### Scenario: Expand truncated output

- **WHEN** the user presses Ctrl+O on a focused collapsed tool card (expandable transcript block)
- **THEN** the card expands to show detailed output
- **AND** Enter is not required as the expand key for this package

### Requirement: Specialized collapsed tool summaries

The TUI SHALL provide specialized collapsed summaries for built-in tools and a human-readable fallback for unknown / MCP tools. Summaries describe information content; exact copy may vary under fidelity A.

#### Scenario: Read done summary

- **WHEN** a `read` tool completes successfully
- **THEN** the collapsed summary communicates lines read
- **AND** the title emphasizes `file_path`

#### Scenario: Write done summary

- **WHEN** a `write` tool completes successfully
- **THEN** the collapsed summary communicates lines written and path
- **AND** the title emphasizes `file_path`

#### Scenario: Edit done summary

- **WHEN** an `edit` tool completes successfully
- **THEN** the collapsed summary communicates path and change scale (for example `+/-` lines or “N lines changed”)
- **AND** expanding shows the numbered diff

#### Scenario: Bash done summary

- **WHEN** a `bash` tool completes with long stdout
- **THEN** the collapsed summary is a short result gist or truncation
- **AND** full stdout is NOT used as the primary collapsed summary
- **AND** the title emphasizes a truncated `command`

#### Scenario: Grep done summary

- **WHEN** a `grep` tool completes successfully
- **THEN** the collapsed summary communicates pattern and hit scale (matches/files)
- **AND** zero hits are explicit when applicable

#### Scenario: Find done summary

- **WHEN** a `find` tool completes successfully
- **THEN** the collapsed summary communicates query intent and result scale

#### Scenario: Ls done summary

- **WHEN** an `ls` tool completes successfully
- **THEN** the collapsed summary communicates target path and entry scale

#### Scenario: Unknown or MCP fallback

- **WHEN** a tool name is not one of the specialized built-ins
- **THEN** the card uses a human-readable display name plus one key argument or short result
- **AND** the same fallback applies to MCP-style tools without per-service hard-coded copy

### Requirement: Ban default raw JSON tool dumps

The TUI MUST NOT present the full tool `input` object or tool envelope via `JSON.stringify` (or equivalent whole-object dump) as the default collapsed user-visible form, including for unknown / MCP tools. Single-field truncated strings and structured expanded detail (diff/body) remain allowed.

#### Scenario: Unknown tool without JSON dump

- **WHEN** an unknown tool completes and would previously dump full input JSON
- **THEN** the collapsed view shows human-readable name + key field or short result instead of a whole-object JSON dump

#### Scenario: Specialized tools without JSON dump

- **WHEN** a specialized built-in tool completes successfully
- **THEN** the collapsed summary is the specialized form defined above rather than a full input JSON dump

