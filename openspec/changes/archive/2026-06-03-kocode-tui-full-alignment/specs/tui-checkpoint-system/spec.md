## ADDED Requirements

### Requirement: Checkpoint creation on file changes
The system SHALL automatically create checkpoints (file content snapshots) before each file modification.

#### Scenario: Checkpoint before Write
- **WHEN** the agent is about to write to a file
- **THEN** a checkpoint of the current file state is saved (or marked as "new file" if it doesn't exist)
- **AND** the checkpoint is linked to the current turn

#### Scenario: Checkpoint before Edit
- **WHEN** the agent is about to edit a file
- **THEN** a checkpoint of the current file content is saved

### Requirement: Rewind via Escape key
The system SHALL support rewinding code state to the last checkpoint when user presses Esc Esc.

#### Scenario: Double Escape triggers rewind
- **WHEN** user presses Escape twice rapidly
- **THEN** a rewind confirmation dialog is shown: "Rewind to before the last change?"
- **AND** options: Yes / No

#### Scenario: Rewind confirmed
- **WHEN** user confirms rewind
- **THEN** all files modified in the current turn are restored to their checkpoint state
- **AND** the conversation state is reverted to before the current turn
- **AND** a "Rewound" confirmation is displayed

### Requirement: Rewind command
The system SHALL support `/rewind` command as an alternative to Esc Esc for rewinding.

#### Scenario: /rewind restores state
- **WHEN** user runs `/rewind`
- **THEN** the same rewind behavior as Esc Esc is triggered
