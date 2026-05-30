## ADDED Requirements

### Requirement: `kocode` command entry
The system SHALL provide a `kocode` command that supports interactive, non-interactive, and piped-input usage.

#### Scenario: Start interactive TUI
- **GIVEN** the user runs `kocode` without `--print`
- **WHEN** configuration and model selection are resolved
- **THEN** the CLI creates an `AgentSession` and starts the Ink TUI

#### Scenario: Run print mode
- **GIVEN** the user runs `kocode --print "msg"`
- **WHEN** the model response completes
- **THEN** the CLI prints the assistant response to stdout and exits without launching the TUI

#### Scenario: Read piped input
- **GIVEN** the user runs `echo "msg" | kocode`
- **WHEN** stdin is not an interactive terminal
- **THEN** the CLI reads stdin as the prompt and starts the appropriate interactive or print flow

#### Scenario: Show help and version
- **GIVEN** the user passes `--help` or `--version`
- **WHEN** the CLI parses arguments
- **THEN** it prints the requested metadata and exits successfully

### Requirement: CLI options
The system SHALL support command-line options for provider, model, config file, session id, and print mode.

#### Scenario: Override model from arguments
- **GIVEN** config defines a default provider and model
- **WHEN** `--provider` or `--model` is supplied
- **THEN** the CLI uses the command-line value instead of the configured default

#### Scenario: Use a custom config path
- **GIVEN** `--config <path>` is supplied
- **WHEN** the CLI loads configuration
- **THEN** it reads and writes configuration at the supplied path instead of the default global path

### Requirement: Configuration resolution
The system SHALL load configuration from global config, optional project config, command-line arguments, and environment variables with clear precedence.

#### Scenario: Load global config
- **GIVEN** `~/.kocode/config.yaml` exists
- **WHEN** the CLI starts
- **THEN** it loads providers, defaults, and optional model definitions from the file

#### Scenario: Apply project config
- **GIVEN** `.kocode/config.yaml` exists in the project
- **WHEN** the CLI starts in that project
- **THEN** project-level configuration overrides or augments global configuration according to documented precedence

#### Scenario: Override API keys from environment
- **GIVEN** config contains provider API keys
- **WHEN** `KOCODE_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or provider-specific variables are set
- **THEN** environment values take precedence over stored config values

### Requirement: Provider and model configuration
The system SHALL support multiple providers and build the selectable model list from configured providers, built-in models, and custom model definitions.

#### Scenario: Hide unconfigured providers
- **GIVEN** built-in models exist for several providers
- **WHEN** only one provider is configured
- **THEN** models for unconfigured providers do not appear in the selection list

#### Scenario: Use custom model definitions
- **GIVEN** config includes a custom model with provider, API type, base URL, and token metadata
- **WHEN** model options are resolved
- **THEN** the custom model can be selected like a built-in model

### Requirement: Session management commands
The system SHALL provide commands to list, resume, delete, and optionally rename local sessions.

#### Scenario: List sessions
- **GIVEN** session JSONL files exist under `~/.kocode/sessions`
- **WHEN** the user runs `kocode sessions list`
- **THEN** the CLI prints available session ids and useful metadata

#### Scenario: Resume a session
- **GIVEN** a valid session id exists
- **WHEN** the user runs `kocode --session <id>`
- **THEN** the CLI restores the session history before accepting new input

#### Scenario: Delete a session
- **GIVEN** a valid session id exists
- **WHEN** the user runs `kocode sessions delete <id>`
- **THEN** the CLI deletes the session data or reports a clear failure

#### Scenario: Rename a session
- **GIVEN** session renaming is enabled
- **WHEN** the user runs the rename command
- **THEN** the CLI updates the session metadata without losing message history
