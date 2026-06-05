# agent-runtime Specification

## Purpose
TBD - created by archiving change kocode-multi-provider. Update Purpose after archive.
## Requirements
### Requirement: Tool-enabled agent loop
The system SHALL implement an agent loop that builds context, streams a tool-enabled model response, executes requested tools, and repeats until the model stops or a configured loop limit is reached.

#### Scenario: Complete a normal assistant turn
- **GIVEN** a user prompt and configured model
- **WHEN** `AgentSession.prompt()` starts a turn
- **THEN** the agent builds context, calls ko-ai `stream()`, processes streamed assistant events, and emits a final turn completion event when the model stops

#### Scenario: Execute a requested tool
- **GIVEN** the model emits a completed tool call event
- **WHEN** the agent receives the tool call
- **THEN** it validates and executes the tool, appends a tool result message, emits tool start/end events, and continues the loop

#### Scenario: Prevent infinite loops
- **GIVEN** the model repeatedly requests tools
- **WHEN** the configured maximum loop count is reached
- **THEN** the agent stops the turn with a clear max-loop error instead of continuing forever

#### Scenario: Cancel an active turn
- **GIVEN** a turn is in progress
- **WHEN** `cancel()` is called or the abort signal is triggered
- **THEN** the agent checks the signal during the loop, stops further provider/tool work, and emits a cancelled state

### Requirement: Agent session lifecycle and events
The system SHALL provide an `AgentSession` class with prompt, cancel, state management, and an event bus for all externally visible state changes.

#### Scenario: Subscribe to session events
- **GIVEN** a TUI subscribes with `addEventListener(callback)`
- **WHEN** the session emits turn, message, thinking, tool, compaction, or model-change events
- **THEN** the callback receives typed `AgentSessionEvent` values in order

#### Scenario: Prompt through a session
- **GIVEN** an idle `AgentSession`
- **WHEN** `prompt(message, options)` is called
- **THEN** the session records the user message, starts the agent loop, and updates state for the active turn

### Requirement: JSONL session persistence
The system SHALL persist and restore conversation history using JSONL files under `~/.kocode/sessions/<session-id>.jsonl`.

#### Scenario: Persist messages
- **GIVEN** a session produces user, assistant, or tool result messages
- **WHEN** each message becomes complete
- **THEN** the session appends one complete message JSON object per line to the session JSONL file

#### Scenario: Restore a session
- **GIVEN** a session id with an existing JSONL file
- **WHEN** the session is loaded
- **THEN** the message list is reconstructed from the JSONL lines and can continue in a new turn

### Requirement: Message compaction
The system SHALL detect high context usage and compact middle conversation history while preserving recent tool call/result pairs and generating an LLM summary of discarded messages.

#### Scenario: Trigger compaction by threshold
- **GIVEN** the estimated token usage exceeds the configured threshold, defaulting to 80 percent of the model context window
- **WHEN** the agent prepares context
- **THEN** it emits compaction_start, preserves recent tool pairs, summarizes older messages via LLM, and emits compaction_end with before/after token counts

#### Scenario: Trigger compaction on overflow
- **GIVEN** a provider call would exceed the model context window
- **WHEN** the agent detects or receives context overflow
- **THEN** it attempts compaction before failing the turn

#### Scenario: Manual compaction
- **GIVEN** a user or TUI command requests compaction
- **WHEN** manual compaction is supported by the session
- **THEN** the same compaction flow runs and updates persisted conversation state

#### Scenario: Tool call/result pairs are preserved in recent messages
- **GIVEN** the last 3 turns contain tool call and tool result message pairs
- **WHEN** compaction runs
- **THEN** those tool call/result pairs remain intact in the compacted message list

#### Scenario: LLM summary replaces discarded messages
- **GIVEN** messages 3-15 are discarded during compaction
- **WHEN** the LLM summary call succeeds
- **THEN** a synthetic summary message is inserted between the preserved head and tail

#### Scenario: LLM summary failure falls back to truncation
- **GIVEN** the LLM summary call fails or times out
- **WHEN** compaction runs
- **THEN** the system falls back to simple truncation (keep head + tail) without error

### Requirement: System prompt generation
The system SHALL generate a system prompt that includes project information, tool instructions, current date, and optional local context files.

#### Scenario: Include project context
- **GIVEN** a project root with optional `CLAUDE.md` or `.kocode/context.md`
- **WHEN** a session starts
- **THEN** the system prompt includes discovered project instructions along with generated project metadata

#### Scenario: Include current date
- **GIVEN** a session starts on a specific date
- **WHEN** the system prompt is generated
- **THEN** it includes the current date so model responses can reason about relative dates consistently

### Requirement: Retry retryable provider failures
The system SHALL retry retryable API errors and timeouts using bounded backoff.

#### Scenario: Retry a transient provider error
- **GIVEN** a provider request fails with a retryable error
- **WHEN** retry attempts remain
- **THEN** the agent waits according to the backoff policy and retries before surfacing the failure

### Requirement: Token estimation
The system SHALL estimate token counts using a character-class-aware heuristic that accounts for CJK characters.

#### Scenario: English text estimation
- **GIVEN** a message containing 400 ASCII characters
- **WHEN** `estimateTokens()` is called
- **THEN** it returns approximately 100 tokens (4 chars/token)

#### Scenario: CJK text estimation
- **GIVEN** a message containing 200 CJK characters
- **WHEN** `estimateTokens()` is called
- **THEN** it returns approximately 100 tokens (2 chars/token)

#### Scenario: Mixed content estimation
- **GIVEN** a message with 200 ASCII chars and 100 CJK chars
- **WHEN** `estimateTokens()` is called
- **THEN** it returns approximately 100 tokens (50 from ASCII + 50 from CJK)

