# tui-model-selector Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Model selector list
The system SHALL display an interactive model selection list when `/model` is invoked without arguments.

#### Scenario: Model list display
- **WHEN** user runs `/model` without arguments
- **THEN** a numbered list of available models is displayed:
  - Default (recommended) — shows current default model
  - Custom Opus model
  - Custom Sonnet model
  - Custom Haiku model
- **AND** the current model is marked with ✔

#### Scenario: Model selection confirmation
- **WHEN** user selects a model number and presses Enter
- **THEN** the model is switched
- **AND** a confirmation message is shown
- **AND** the model_changed event is emitted

### Requirement: Model selector keyboard interaction
The system SHALL support ↑/↓ navigation and Enter to confirm in the model selector.

#### Scenario: Arrow navigation
- **WHEN** the model selector is displayed
- **THEN** ↑/↓ move the selection
- **AND** Enter confirms the selected model
- **AND** Escape closes the selector without changing

