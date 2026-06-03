## MODIFIED Requirements

### Requirement: Static model catalogue
The system SHALL include built-in model metadata in `models.ts` and generated model data in `models.generated.ts`, and SHALL merge configured custom model definitions into the selectable model catalogue.

#### Scenario: List built-in models
- **GIVEN** no custom model definitions are configured
- **WHEN** the CLI or TUI requests available models
- **THEN** ko-ai provides static model metadata including provider, API type, context window, max tokens, reasoning support, and cost fields

#### Scenario: List custom models
- **GIVEN** config defines a custom model under a configured provider
- **WHEN** the CLI or TUI requests available models
- **THEN** the custom model appears alongside matching built-in models with its configured metadata

#### Scenario: Preserve custom provider compatibility settings
- **GIVEN** config defines a custom model with `compat` settings
- **WHEN** that model is resolved for a provider adapter
- **THEN** the resolved model preserves the `compat` settings for request and response adaptation

#### Scenario: Preserve custom headers
- **GIVEN** config defines a custom model with provider `headers`
- **WHEN** that model is used for a provider request
- **THEN** the configured headers are available to the provider adapter
