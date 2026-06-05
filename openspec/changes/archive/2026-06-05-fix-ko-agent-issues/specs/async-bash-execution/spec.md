## ADDED Requirements

### Requirement: Bash tool executes commands asynchronously
The Bash tool SHALL execute shell commands using a non-blocking child process so the Node.js event loop remains unblocked during execution.

#### Scenario: Short command completes normally
- **GIVEN** a Bash tool call with `command: "echo hello"`
- **WHEN** the tool executes
- **THEN** the command runs asynchronously and returns `{ isError: false, content: "hello\n" }` without blocking the event loop

#### Scenario: Long-running command does not freeze TUI
- **GIVEN** a Bash tool call with `command: "sleep 5"`
- **WHEN** the tool executes
- **THEN** the event loop remains unblocked during the 5-second sleep and Ink continues rendering

#### Scenario: Command timeout is enforced
- **GIVEN** a Bash tool call with `command: "sleep 100"` and `timeout: 1000`
- **WHEN** the command exceeds the timeout
- **THEN** the child process is killed and the tool returns an error with timeout indication

#### Scenario: Command exits with non-zero code
- **GIVEN** a Bash tool call with `command: "exit 1"`
- **WHEN** the command finishes
- **THEN** the tool returns `{ isError: true, content: <stderr or exit message> }`

#### Scenario: stdout and stderr are both captured
- **GIVEN** a Bash tool call with `command: "echo out; echo err >&2"`
- **WHEN** the command finishes
- **THEN** the result contains both stdout and stderr content

### Requirement: Bash tool uses spawn instead of execSync
The Bash tool SHALL use `child_process.spawn` with `shell: true` instead of `execSync` to maintain shell interpretation while avoiding event loop blocking.

#### Scenario: Shell features work as before
- **GIVEN** a Bash tool call with `command: "echo *.ts | wc -l"`
- **WHEN** the tool executes with `shell: true`
- **THEN** glob expansion and piping work correctly, matching previous execSync behavior

#### Scenario: Working directory is set correctly
- **GIVEN** a Bash tool call and the session cwd is `/workspace`
- **WHEN** the tool executes
- **THEN** the child process runs with cwd set to `/workspace`
