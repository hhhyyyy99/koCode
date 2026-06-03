# multi-provider-api Specification

## Purpose
TBD - created by archiving change kocode-multi-provider. Update Purpose after archive.
## Requirements
### Requirement: Unified LLM protocol types
The system SHALL provide a provider-neutral LLM API contract for models, contexts, messages, tools, usage, stop reasons, and streaming assistant events.

#### Scenario: Build a provider-neutral context
- **GIVEN** a configured model, system prompt, conversation messages, and tools
- **WHEN** ko-ai receives a request
- **THEN** it can represent the request using `Model`, `Context`, `Message`, and `Tool` types without provider-specific message shapes leaking to callers

#### Scenario: Consume streaming events
- **GIVEN** a provider returns streamed text, thinking, tool call, done, or error data
- **WHEN** ko-ai adapts the response
- **THEN** callers receive unified assistant events including start, text_start/delta/end, thinking_start/delta/end, toolcall_start/delta/end, done, and error

### Requirement: Provider registration and lazy loading
The system SHALL provide a global provider registry with provider lookup and lazy module loading.

#### Scenario: Load a provider on first use
- **GIVEN** a provider is registered with lazy stream factories
- **WHEN** a caller requests a stream for the provider API type
- **THEN** the provider implementation is imported only when first needed and then used for subsequent calls

#### Scenario: Query registered providers
- **GIVEN** providers have been registered
- **WHEN** `getProvider(api)` is called
- **THEN** the matching provider is returned or a clear error is raised for an unknown API type

### Requirement: Built-in provider adapters
The system SHALL implement built-in adapters for Anthropic Messages, OpenAI Chat/Completions-compatible APIs, and Google Gemini.

#### Scenario: Stream from an Anthropic model
- **GIVEN** an Anthropic Messages model and API key
- **WHEN** the caller starts a stream
- **THEN** the adapter uses `@anthropic-ai/sdk` and emits unified text, thinking, and tool call events

#### Scenario: Stream from an OpenAI-compatible model
- **GIVEN** an OpenAI or OpenAI-compatible model such as DeepSeek, Groq, Together, or OpenRouter
- **WHEN** the caller starts a stream
- **THEN** the adapter uses the OpenAI SDK-compatible protocol and maps function/tool calls to unified tool call events

#### Scenario: Stream from a Gemini model
- **GIVEN** a Google Gemini model and API key
- **WHEN** the caller starts a stream
- **THEN** the adapter uses `@google/generative-ai` and maps `functionCall` data to unified tool call events

### Requirement: Provider compatibility configuration
The system SHALL expose compatibility settings for provider-specific protocol differences.

#### Scenario: Apply OpenAI compatibility overrides
- **GIVEN** a model defines `OpenAICompat` options such as token field, reasoning support, thinking format, or cache-control format
- **WHEN** the OpenAI-compatible adapter builds a request or parses a response
- **THEN** it applies those options instead of assuming OpenAI defaults

#### Scenario: Apply Anthropic compatibility overrides
- **GIVEN** a model defines `AnthropicCompat` options such as eager tool input streaming or long cache retention support
- **WHEN** the Anthropic-compatible adapter handles a request
- **THEN** it adapts request and response behavior according to those capabilities

### Requirement: Top-level call helpers
The system SHALL provide `stream`, `complete`, `streamSimple`, and `completeSimple` helper functions with API key injection from explicit config or environment variables.

#### Scenario: Stream a tool-enabled response
- **GIVEN** a model, context, and options
- **WHEN** `stream(model, context, options)` is called
- **THEN** ko-ai resolves the correct provider and returns an async iterable stream with unified events including tool call events

#### Scenario: Complete a response
- **GIVEN** a model, context, and options
- **WHEN** `complete(model, context, options)` is called
- **THEN** ko-ai collects the stream into a final assistant message, usage, and stop reason

#### Scenario: Use simple no-tool helpers
- **GIVEN** a caller only needs plain model output
- **WHEN** `streamSimple` or `completeSimple` is called
- **THEN** ko-ai exposes a simplified API that does not require callers to manage tool call execution

#### Scenario: Inject API keys
- **GIVEN** no API key is explicitly provided in options
- **WHEN** a provider call is made
- **THEN** ko-ai reads the relevant environment variable such as `KOCODE_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GOOGLE_API_KEY`

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

