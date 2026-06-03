# tool-system Specification

## Purpose
TBD - created by archiving change kocode-multi-provider. Update Purpose after archive.
## Requirements
### Requirement: Tool definition and registry
The system SHALL define tool interfaces, validate tool inputs, register tools, and expose registered tools in provider-compatible formats.

#### Scenario: Register a tool
- **GIVEN** a `ToolDefinition` and `ToolExecutor`
- **WHEN** `registerTool(definition, executor)` is called
- **THEN** the tool is available through `getTools()` and can be executed by name

#### Scenario: Validate tool input
- **GIVEN** a tool call contains JSON input
- **WHEN** the tool executor is invoked
- **THEN** the input is validated against the tool JSON Schema before execution

#### Scenario: Convert tools for providers
- **GIVEN** registered internal tools
- **WHEN** a provider request is built
- **THEN** tool definitions are converted to Anthropic, OpenAI, or Google-compatible tool schemas as needed

### Requirement: Built-in file and shell tools
The system SHALL provide built-in Read, Edit, Write, Bash, Grep, Find, and Ls tools for coding workflows.

#### Scenario: Read a file range
- **GIVEN** a Read tool call with a path and optional line range or offset
- **WHEN** the tool executes
- **THEN** it returns the requested file content with enough location metadata for the agent to cite lines

#### Scenario: Edit a file by exact replacement
- **GIVEN** an Edit tool call with an exact old string and replacement string
- **WHEN** exactly one match is found in the target file
- **THEN** the file is updated and a diff preview/result is produced

#### Scenario: Write a file
- **GIVEN** a Write tool call with a path and content
- **WHEN** the call is allowed
- **THEN** the file is created or overwritten and a diff preview/result is produced

#### Scenario: Run a shell command
- **GIVEN** a Bash tool call with a command and timeout
- **WHEN** the command is allowed by command policy
- **THEN** the command runs with timeout control and returns exit code, stdout, and stderr

#### Scenario: Search and list project files
- **GIVEN** Grep, Find, or Ls tool calls
- **WHEN** they execute inside the workspace
- **THEN** they return matching text, matching file paths, or directory entries respectively

### Requirement: Tool safety controls
The system SHALL restrict file-system access to the current workspace and require policy checks for risky operations.

#### Scenario: Block path traversal
- **GIVEN** a tool input references a path outside the configured cwd
- **WHEN** the tool resolves the path
- **THEN** execution is rejected before any read or write occurs

#### Scenario: Enforce Bash command policy
- **GIVEN** Bash command allowlist or blocklist configuration
- **WHEN** a Bash tool call is requested
- **THEN** disallowed commands are rejected before execution

#### Scenario: Confirm dangerous operations
- **GIVEN** a tool call would perform a dangerous write or shell operation
- **WHEN** permission confirmation is required by policy
- **THEN** the tool does not execute until the user confirms the operation

### Requirement: Cross-provider tool result handling
The system SHALL adapt tool calls and tool results across Anthropic tool_use, OpenAI function/tool call, and Google functionCall formats.

#### Scenario: Execute an Anthropic tool call
- **GIVEN** an Anthropic provider emits a `tool_use` block
- **WHEN** the agent receives the unified tool call
- **THEN** the tool executes and the result is converted back into a provider-compatible tool result message

#### Scenario: Execute an OpenAI tool call
- **GIVEN** an OpenAI-compatible provider emits a function/tool call
- **WHEN** the agent receives the unified tool call
- **THEN** the tool executes and the result is converted back into an OpenAI-compatible tool result message

#### Scenario: Execute a Google tool call
- **GIVEN** a Google provider emits a `functionCall`
- **WHEN** the agent receives the unified tool call
- **THEN** the tool executes and the result is converted back into a Google-compatible function response

