## MODIFIED Requirements

### Requirement: Provider and model configuration
The system SHALL support multiple providers and build the selectable model list from configured providers, built-in models, and custom model definitions, including custom model compatibility and headers.

#### Scenario: Hide unconfigured providers
- **GIVEN** built-in models exist for several providers
- **WHEN** only one provider is configured
- **THEN** models for unconfigured providers do not appear in the selection list

#### Scenario: Use custom model definitions
- **GIVEN** config includes a custom model with provider, API type, base URL, and token metadata
- **WHEN** model options are resolved
- **THEN** the custom model can be selected like a built-in model

#### Scenario: Resolve custom model compat and headers
- **GIVEN** config includes a custom model with `compat` and `headers`
- **WHEN** the CLI resolves that model
- **THEN** the resolved model includes those fields for downstream provider calls

## ADDED Requirements

### Requirement: Config management command
The CLI SHALL expose a `kocode config` command family for validating, inspecting, mutating, opening, locating, and initializing config files.

#### Scenario: Show config command help
- **WHEN** the user runs `kocode config` without a specific subcommand
- **THEN** the CLI shows available config subcommands or the current config summary

#### Scenario: Inspect config values
- **WHEN** the user runs `kocode config show`, `kocode config get <key>`, or `kocode config path`
- **THEN** the CLI prints the requested configuration information without exposing unmasked API keys in summary output

#### Scenario: Mutate config values
- **WHEN** the user runs `kocode config set <key> <value>`, `kocode config unset <key>`, or `kocode config init`
- **THEN** the CLI updates or initializes the config file accordingly

#### Scenario: Open config file
- **WHEN** the user runs `kocode config open`
- **THEN** the CLI opens the config path in the configured editor
