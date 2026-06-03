# config-management Specification

## Purpose
TBD - created by archiving change kocode-config-tui-enhance. Update Purpose after archive.
## Requirements
### Requirement: Configuration schema validation
The CLI SHALL validate koCode configuration files against the supported provider, model, and default-selection schema when loading or changing config.

#### Scenario: Valid provider configuration
- **GIVEN** a config file defines providers with apiKey, optional baseUrl, optional models, optional compat, and optional headers
- **WHEN** the CLI loads the config
- **THEN** validation succeeds and the config can be used to resolve providers and models

#### Scenario: Invalid config reports an error
- **GIVEN** a config file contains a wrong type or missing required provider data
- **WHEN** the CLI validates the config
- **THEN** it reports a clear validation error instead of silently ignoring the problem

### Requirement: Config inspection commands
The CLI SHALL provide config commands for showing, reading, opening, and locating configuration.

#### Scenario: Show masked configuration
- **WHEN** the user runs `kocode config show`
- **THEN** the CLI prints the current config with API keys masked

#### Scenario: Get nested config value
- **WHEN** the user runs `kocode config get providers.anthropic.apiKey`
- **THEN** the CLI reads the nested value using dot-path lookup

#### Scenario: Print config path
- **WHEN** the user runs `kocode config path`
- **THEN** the CLI prints the config file path it will manage

#### Scenario: Open config in editor
- **WHEN** the user runs `kocode config open`
- **THEN** the CLI opens the config file with `$EDITOR` or a fallback editor

### Requirement: Config mutation commands
The CLI SHALL provide config commands for setting, unsetting, and initializing configuration.

#### Scenario: Set nested config value
- **WHEN** the user runs `kocode config set providers.anthropic.apiKey test-key`
- **THEN** the CLI writes that nested value to the config file

#### Scenario: Unset nested config value
- **WHEN** the user runs `kocode config unset providers.anthropic.apiKey`
- **THEN** the CLI removes that nested value and reports whether it existed

#### Scenario: Initialize default config
- **WHEN** the user runs `kocode config init`
- **THEN** the CLI writes a default config template if one does not already exist

