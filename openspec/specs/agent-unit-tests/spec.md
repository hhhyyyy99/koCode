# agent-unit-tests Specification

## Purpose
TBD - created by archiving change fix-ko-agent-issues. Update Purpose after archive.
## Requirements
### Requirement: Tool execution tests
The test suite SHALL cover tool input validation, path sandboxing, and bash policy enforcement.

#### Scenario: Path traversal is blocked
- **GIVEN** a tool call with `file_path: "../../etc/passwd"` and cwd `/workspace`
- **WHEN** `safePath` is called
- **THEN** it returns `{ ok: false, error: "Path traversal not allowed" }`

#### Scenario: Valid path within cwd resolves
- **GIVEN** a tool call with `file_path: "src/main.ts"` and cwd `/workspace`
- **WHEN** `safePath` is called
- **THEN** it returns `{ ok: true, path: "/workspace/src/main.ts" }`

#### Scenario: Missing required parameter is rejected
- **GIVEN** a tool schema with `required: ["file_path"]` and input `{}`
- **WHEN** `validateSchema` is called
- **THEN** it returns `"Missing required parameter: file_path"`

#### Scenario: Wrong parameter type is rejected
- **GIVEN** a tool schema with `properties.file_path.type: "string"` and input `{ file_path: 123 }`
- **WHEN** `validateSchema` is called
- **THEN** it returns an error about the type mismatch

#### Scenario: Dangerous bash command is blocked
- **GIVEN** a bash policy with default dangerous commands
- **WHEN** `checkBashPolicy("rm -rf /")` is called
- **THEN** it returns a non-null error string

#### Scenario: Bash deny list blocks listed commands
- **GIVEN** a bash policy with `deny: ["curl"]`
- **WHEN** `checkBashPolicy("curl http://example.com")` is called
- **THEN** it returns a non-null error string

#### Scenario: Bash allow list blocks unlisted commands
- **GIVEN** a bash policy with `allow: ["git", "pnpm"]`
- **WHEN** `checkBashPolicy("curl http://example.com")` is called
- **THEN** it returns a non-null error string

### Requirement: Permission logic tests
The test suite SHALL cover all combinations of tool categories and permission modes.

#### Scenario: Read-only tools never require permission
- **GIVEN** tool names `ls`, `read`, `grep`, `find`
- **WHEN** `shouldRequestToolPermission` is called with any mode
- **THEN** it returns `false`

#### Scenario: Default mode requires permission for write/edit/bash
- **GIVEN** permission mode `"default"`
- **WHEN** `shouldRequestToolPermission` is called for `write`, `edit`, or `bash`
- **THEN** it returns `true`

#### Scenario: Accept-edits mode auto-approves write and edit
- **GIVEN** permission mode `"accept_edits"`
- **WHEN** `shouldRequestToolPermission` is called for `write` or `edit`
- **THEN** it returns `false`

#### Scenario: Accept-edits mode still requires bash permission
- **GIVEN** permission mode `"accept_edits"`
- **WHEN** `shouldRequestToolPermission` is called for `bash`
- **THEN** it returns `true`

#### Scenario: Auto mode requires no permission
- **GIVEN** permission mode `"auto"`
- **WHEN** `shouldRequestToolPermission` is called for any category
- **THEN** it returns `false`

### Requirement: Session store tests
The test suite SHALL cover JSONL session CRUD and branch operations using temporary directories.

#### Scenario: Create and load a session
- **GIVEN** a fresh sessions directory
- **WHEN** `createSession()` is called and messages are appended
- **THEN** `loadSession(id)` returns the appended messages in order

#### Scenario: List sessions returns all JSONL files
- **GIVEN** 3 sessions created
- **WHEN** `listSessions()` is called
- **THEN** it returns 3 entries with correct ids

#### Scenario: Create branch copies session content
- **GIVEN** a session with 5 messages
- **WHEN** `createBranch(sessionId, "test-branch")` is called
- **THEN** the new branch session contains the same 5 messages and `listBranches` shows main + test-branch

#### Scenario: Delete session removes the JSONL file
- **GIVEN** an existing session
- **WHEN** `deleteSession(id)` is called
- **THEN** `loadSession(id)` returns `[]` and the file no longer exists

