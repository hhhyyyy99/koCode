## ADDED Requirements

### Requirement: Built-in tools are classified by effect
The agent SHALL classify each built-in tool by its effect before making a permission decision.

#### Scenario: Read-only built-ins
- **WHEN** the tool name is `ls`, `read`, `grep`, or `find`
- **THEN** the tool category is read-only

#### Scenario: Mutation built-ins
- **WHEN** the tool name is `write` or `edit`
- **THEN** the tool category is file mutation

#### Scenario: Command execution built-in
- **WHEN** the tool name is `bash`
- **THEN** the tool category is command execution

### Requirement: Read-only built-ins do not request file creation permission
The agent SHALL NOT emit a file creation permission request for read-only built-in tools.

#### Scenario: Project analysis lists files
- **WHEN** the model calls `ls` with path `.` during project analysis in default permission mode
- **THEN** the agent executes the tool without emitting a `permission_request` with `toolType` `write`

#### Scenario: Search reads workspace
- **WHEN** the model calls `grep` or `find` in default permission mode
- **THEN** the agent does not ask to create or edit a file

### Requirement: Mutating and execution tools remain gated
The agent SHALL require permission for file mutation and command execution tools in default permission mode.

#### Scenario: Write prompts for file creation
- **WHEN** the model calls `write` in default permission mode
- **THEN** the agent emits a permission request classified as file creation

#### Scenario: Edit prompts for file edit
- **WHEN** the model calls `edit` in default permission mode
- **THEN** the agent emits a permission request classified as file edit

#### Scenario: Bash prompts for command execution
- **WHEN** the model calls `bash` in default permission mode
- **THEN** the agent emits a permission request classified as command execution

### Requirement: Unknown tools do not masquerade as write
The agent SHALL NOT classify an unknown or uncategorized tool as file creation by fallback.

#### Scenario: Unknown tool requests permission
- **WHEN** an uncategorized tool requires permission
- **THEN** the permission request uses an unknown or generic category rather than `write`
