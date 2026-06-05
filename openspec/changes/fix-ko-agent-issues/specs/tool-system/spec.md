## MODIFIED Requirements

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

#### Scenario: Edit a file replacing all occurrences
- **GIVEN** an Edit tool call with `replace_all: true`, an old string that appears multiple times, and a replacement string
- **WHEN** the tool executes
- **THEN** every occurrence of the old string is replaced and the file is updated

#### Scenario: Edit replace_all with no matches returns error
- **GIVEN** an Edit tool call with `replace_all: true` and an old string not found in the file
- **WHEN** the tool executes
- **THEN** it returns an error indicating the string was not found

#### Scenario: Write a file
- **GIVEN** a Write tool call with a path and content
- **WHEN** the call is allowed
- **THEN** the file is created or overwritten and a diff preview/result is produced

#### Scenario: Run a shell command asynchronously
- **GIVEN** a Bash tool call with a command and timeout
- **WHEN** the command is allowed by command policy
- **THEN** the command runs asynchronously via spawn with timeout control and returns exit code, stdout, and stderr

#### Scenario: Search and list project files
- **GIVEN** Grep, Find, or Ls tool calls
- **WHEN** they execute inside the workspace
- **THEN** they return matching text, matching file paths, or directory entries respectively
