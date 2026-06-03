## MODIFIED Requirements

### Requirement: User message event emission
The system SHALL emit a `user_message` event when the user sends a message in a session, containing the full message content and optional images.

#### Scenario: User sends text message
- **WHEN** `session.prompt("hello")` is called
- **THEN** a `user_message` event is emitted with `{ type: "user_message", content: "hello" }`
- **AND** the turn_start event follows after

#### Scenario: User message with images
- **WHEN** `session.prompt("analyze this", images: [...])` is called
- **THEN** the `user_message` event includes the images array

## ADDED Requirements

### Requirement: Shell execution event
The system SHALL emit `shell_start` and `shell_end` events when the user uses `!` prefix to execute a shell command.

#### Scenario: Shell command executed
- **WHEN** a shell command is executed via `!` prefix
- **THEN** a `shell_start` event is emitted with `{ type: "shell_start", command: "ls -la" }`
- **AND** when complete, a `shell_end` event is emitted with `{ type: "shell_end", exitCode: 0, stdout: "...", stderr: "" }`

### Requirement: Permission request and response events
The system SHALL use `permission_request` and `permission_response` events for bidirectional communication between Agent and TUI during tool execution authorization.

#### Scenario: Agent requests permission before tool execution
- **WHEN** the agent is about to execute a tool that requires user confirmation
- **THEN** a `permission_request` event is emitted with `{ type: "permission_request", requestId: "<uuid>", toolType: "bash"|"write"|"edit", toolName: "...", params: {...}, description: "..." }`
- **AND** the agent pauses execution until a `permission_response` is received

#### Scenario: User approves via TUI
- **WHEN** the user selects "Yes" in the permission dialog
- **THEN** a `permission_response` is sent with `{ type: "permission_response", requestId: "<uuid>", action: "approve" }`
- **AND** the agent proceeds with tool execution

#### Scenario: User denies via TUI
- **WHEN** the user selects "No" in the permission dialog
- **THEN** a `permission_response` is sent with `{ type: "permission_response", requestId: "<uuid>", action: "deny" }`
- **AND** the agent skips the tool and reports refusal

### Requirement: Fast memory event
The system SHALL emit a `memory_saved` event when the user uses `#` prefix to save a memory.

#### Scenario: Memory saved via # prefix
- **WHEN** user submits `# Use tabs` and the line is appended to CLAUDE.md
- **THEN** a `memory_saved` event is emitted with `{ type: "memory_saved", content: "Use tabs", file: ".claude/CLAUDE.local.md" }`
