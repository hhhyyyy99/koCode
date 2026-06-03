# tui-enhancement Specification

## Purpose
TBD - created by archiving change kocode-config-tui-enhance. Update Purpose after archive.
## Requirements
### Requirement: Assistant Markdown rendering
The TUI SHALL render assistant message text as Markdown rather than plain unformatted text.

#### Scenario: Markdown content appears formatted
- **WHEN** assistant text contains code blocks, bold text, links, or lists
- **THEN** the TUI renders those constructs with the available terminal Markdown formatting

### Requirement: Edit tool diff preview
The TUI SHALL render edit tool changes as a readable diff preview when old and new text are available.

#### Scenario: Edit tool shows additions and removals
- **GIVEN** an edit tool call includes `old_string` and `new_string`
- **WHEN** the tool result is displayed
- **THEN** removed lines are rendered in a removal style and added lines are rendered in an addition style

### Requirement: Multi-line input shortcut
The TUI SHALL support inserting newlines in the input without submitting the prompt.

#### Scenario: Alt Enter inserts newline
- **WHEN** the user presses Alt+Enter while editing the input
- **THEN** the input inserts a newline and does not submit

#### Scenario: Enter submits prompt
- **WHEN** the user presses Enter without Alt while editing the input
- **THEN** the current prompt is submitted

