## 1. P0 — Async Bash Execution

- [x] 1.1 Replace `execSync` with `spawn` in `bashTool.execute()` — use `child_process.spawn` with `shell: true`, collect stdout/stderr buffers, enforce timeout via `AbortController`/`setTimeout`
- [x] 1.2 Update `bashTool` return to include both stdout and stderr in the result content (matching current execSync behavior where stderr appears on error)
- [x] 1.3 Verify bash policy checks (`checkBashPolicy`) still run before spawn, and path sandbox is unaffected
- [x] 1.4 Manual test: run a long command (e.g. `sleep 3`) and confirm TUI stays responsive

## 2. P1 — Edit Replace-All

- [x] 2.1 Add `replace_all` optional boolean parameter to `editTool.parameters` JSON Schema
- [x] 2.2 Update `editTool.execute()` — when `replace_all: true`, use `split(old_string).join(new_string)` instead of `replace()`; validate that at least one match exists
- [x] 2.3 Add `replace_all` to the schema `required` list as NOT required (optional param, defaults to false)

## 3. P1 — Implement `approve_all` Permission Action

- [x] 3.1 Add `sessionApprovedCategories: Set<ToolPermissionCategory>` field to `AgentSession`
- [x] 3.2 In the permission handling block of `runAgentLoop()`, when `permission === "approve_all"`, add the tool's category to `sessionApprovedCategories`
- [x] 3.3 Update `checkToolPermission()` to check `sessionApprovedCategories.has(category)` before calling `shouldRequestToolPermission()`
- [x] 3.4 Reset `sessionApprovedCategories` when a new session is resumed or created

## 4. P2 — Improved Compaction

- [x] 4.1 Refactor `performCompaction()` to identify and preserve recent tool_call/tool_result message pairs (scan backwards from tail, keep complete pairs)
- [x] 4.2 Increase the tail window from 8 to 12 messages to preserve more recent context
- [x] 4.3 Add LLM summary step: send discarded messages to `complete()` (tool-free, max_tokens 500) to generate a summary
- [x] 4.4 Insert the summary as a synthetic user message with `[Context summary]` prefix between head and preserved tail
- [x] 4.5 Add fallback: if the LLM summary call fails, fall back to the current truncation behavior silently

## 5. P2 — CJK-Aware Token Estimation

- [x] 5.1 Add a `countCJK(text: string): number` helper that counts characters in CJK Unicode ranges (U+4E00–U+9FFF, U+3400–U+4DBF, etc.)
- [x] 5.2 Update `estimateTokens()` to use `(cjkChars * 0.5) + ((totalChars - cjkChars) * 0.25)` instead of `totalChars / 4`
- [x] 5.3 Update `estimateTextTokens()` (used by `estimateContextInputTokens`) with the same CJK-aware formula

## 6. P3 — Unit Tests for ko-agent

- [x] 6.1 Create `packages/ko-agent/src/__tests__/` directory and `vitest.config.ts` (copy pattern from ko-ai or ko-tui)
- [x] 6.2 Write `tools.test.ts` — test `safePath` (traversal blocked, valid path resolves), `validateSchema` (missing param, wrong type, valid input), `checkBashPolicy` (dangerous command blocked, deny list, allow list)
- [x] 6.3 Write `tool-permissions.test.ts` — test all combinations of tool categories × permission modes (read-only always passes, default blocks write/edit/bash, accept_edits auto-approves write/edit, auto passes all)
- [x] 6.4 Write `session-store.test.ts` — use `os.tmpdir()` for isolation; test create/load/append/list/delete/branch operations
- [x] 6.5 Write `agent-session.test.ts` — mock `stream()` from ko-ai with a canned AsyncIterable; test basic prompt→response loop, tool execution, permission request flow, and compaction trigger
