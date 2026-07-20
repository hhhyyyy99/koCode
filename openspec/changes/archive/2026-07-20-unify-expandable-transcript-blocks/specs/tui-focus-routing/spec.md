## ADDED Requirements

### Requirement: Expandable transcript block focus routes navigation keys
The TUI SHALL route expandable transcript block navigation keys only while expandable transcript block focus is active.

#### Scenario: Move focused expandable block
- **WHEN** expandable transcript block focus is active and the user presses Up, Down, or Tab
- **THEN** focus moves between expandable transcript blocks without modifying the input draft

#### Scenario: Escape returns to input
- **WHEN** expandable transcript block focus is active and the user presses Escape
- **THEN** focus returns to the input mode

#### Scenario: Modal focus blocks transcript shortcuts
- **WHEN** a modal or permission focus mode is active and the user presses Ctrl+O
- **THEN** expandable transcript block expansion does not run
