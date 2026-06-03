## ADDED Requirements

### Requirement: Ink-based TUI shell
The system SHALL provide an Ink/React terminal UI that subscribes to `AgentSession` events and renders assistant activity in real time.

#### Scenario: Render streamed assistant output
- **GIVEN** the agent emits message delta events
- **WHEN** the TUI receives them through a unified `onEvent(event)` handler
- **THEN** the assistant message updates incrementally without waiting for turn completion

#### Scenario: Subscribe to agent events
- **GIVEN** an `AgentSession` is created
- **WHEN** the TUI starts
- **THEN** it subscribes to the session event bus and routes all typed events through one event handling path

### Requirement: Core TUI components
The system SHALL implement components for app layout, user messages, assistant markdown, thinking blocks, tool execution, input, status, and model selection.

#### Scenario: Display conversation content
- **GIVEN** user and assistant messages are present
- **WHEN** the App renders
- **THEN** UserMessage and AssistantMessage components display the conversation, with assistant markdown rendered in the terminal

#### Scenario: Display thinking and tool execution
- **GIVEN** thinking or tool events are emitted
- **WHEN** the TUI receives those events
- **THEN** ThinkingBlock and ToolExecution components show collapsible state, tool progress, and diffs where available

#### Scenario: Display session status
- **GIVEN** model, token usage, and session metadata are known
- **WHEN** the TUI renders the status bar
- **THEN** StatusBar displays the current model, token usage, and session information

### Requirement: Interactive input and commands
The system SHALL support multiline input, history navigation, slash commands, model/session commands, interruption, and optional completion.

#### Scenario: Submit multiline input
- **GIVEN** the user types a multiline prompt
- **WHEN** the configured submit shortcut is pressed
- **THEN** the TUI sends the complete prompt to `AgentSession.prompt()`

#### Scenario: Browse input history
- **GIVEN** previous prompts exist
- **WHEN** the user presses up or down in the input component
- **THEN** the input cycles through prompt history

#### Scenario: Run slash commands
- **GIVEN** the user enters `/help`, `/model`, `/clear`, or `/session`
- **WHEN** the command is submitted
- **THEN** the TUI handles the command without sending it as a normal prompt unless the command requires agent work

#### Scenario: Interrupt the active turn
- **GIVEN** a turn is currently running
- **WHEN** the user presses Ctrl+C
- **THEN** the TUI calls `AgentSession.cancel()` and reflects the interrupted state

### Requirement: Theme support
The system SHALL define a `ThemeConfig` type and ship dark and light themes with optional custom theme JSON loading.

#### Scenario: Use an embedded theme
- **GIVEN** no custom theme is configured
- **WHEN** the TUI starts
- **THEN** it applies either the built-in dark or built-in light theme

#### Scenario: Load a custom theme
- **GIVEN** a custom theme JSON path is configured
- **WHEN** the TUI starts
- **THEN** it validates and applies the custom theme or reports a clear theme error
