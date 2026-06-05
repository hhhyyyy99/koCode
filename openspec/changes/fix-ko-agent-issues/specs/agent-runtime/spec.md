## MODIFIED Requirements

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

## ADDED Requirements

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
