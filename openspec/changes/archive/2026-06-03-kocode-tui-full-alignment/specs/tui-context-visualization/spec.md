## ADDED Requirements

### Requirement: Context visualization tree
The system SHALL render a tree view of token usage across all loaded components when `/context` command is invoked.

#### Scenario: Context command output
- **WHEN** user runs `/context`
- **THEN** the output shows a tree structure with:
  - Plugin/Skill names and their token counts (~N tokens)
  - Built-in commands token count
  - System prompt token count
  - CLAUDE.md token count
  - Conversation history token count
- **AND** each node shows estimated tokens with `~` prefix

#### Scenario: Token usage health indicator
- **WHEN** total context usage exceeds 85%
- **THEN** a red warning is shown suggesting `/compact`
- **WHEN** total context usage is between 70-85%
- **THEN** a yellow warning is shown
- **WHEN** total context usage is below 70%
- **THEN** a green indicator is shown

### Requirement: Context breakdown format
The system SHALL display context breakdown with indented tree format matching Claude Code's output.

#### Scenario: Format example
- **WHEN** context breakdown is rendered
- **THEN** each component is shown as:
```
├ <component_name>: ~<N> tokens
```
- **AND** nested components use deeper indentation with `├` and `└` connectors
