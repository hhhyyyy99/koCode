## Why

`@kocode/ko-agent` has 6 known issues that affect usability, correctness, and maintainability. The most critical — `bash` using `execSync` blocking the entire TUI, and `edit` silently replacing only the first match — cause real user pain. The `approve_all` permission option is shown in the TUI but does nothing on the agent side. These should be fixed before the package grows further.

## What Changes

1. **Async bash execution** — Replace `execSync` with `spawn` in the Bash tool so the TUI remains responsive during long-running commands. Introduce a `bash_output` event for streaming stdout/stderr.
2. **Edit replace-all support** — Add a `replace_all` boolean parameter to the Edit tool so the model can opt into replacing all occurrences of a string.
3. **Implement `approve_all` permission action** — When the user selects "Yes, allow all", the agent session tracks approved tool categories for the rest of the session, skipping future permission dialogs for those categories.
4. **Improved compaction** — Replace the naive head-2 + tail-8 truncation with a strategy that preserves more context (keep all recent tool result pairs, increase window, and add an LLM-generated summary of discarded messages).
5. **Better token estimation** — Improve the `字符/4` heuristic to account for CJK characters (2 chars/token) and structured content (JSON, code blocks).
6. **Unit tests for ko-agent** — Add `__tests__/` covering tool execution (path sandbox, schema validation, bash policy), permission logic, session-store CRUD, and compaction.

## Capabilities

### New Capabilities
- `async-bash-execution`: Non-blocking shell command execution with streaming output events
- `agent-unit-tests`: Vitest test suite for ko-agent core logic

### Modified Capabilities
- `tool-system`: Edit tool gains `replace_all` parameter; Bash tool switches from sync to async execution
- `tool-permission-taxonomy`: `approve_all` action now persists approval for the session duration
- `agent-runtime`: Compaction strategy upgraded from truncation to summary-based; token estimation improved for CJK

## Impact

- **Files changed**: `tools/index.ts` (bash, edit), `agent-session.ts` (approve_all, compaction, token estimation), `events.ts` (new `bash_output` event)
- **API surface**: New `bash_output` event type in `AgentSessionEvent`; new optional `replace_all` parameter on Edit tool schema
- **Dependencies**: No new external dependencies for P0-P1; compaction summary may use the existing `ko-ai` `stream()` call
- **Breaking changes**: None — all changes are additive or behavioral fixes
