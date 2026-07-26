## MODIFIED Requirements

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
