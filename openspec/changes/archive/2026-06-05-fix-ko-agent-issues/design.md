## Context

`@kocode/ko-agent` is the agent runtime layer that orchestrates LLM streaming, tool execution, session persistence, and permission management. It currently has 6 known issues discovered during codebase analysis:

1. **Bash uses `execSync`** (`tools/index.ts:211`) — blocks the Node.js event loop, freezing the TUI during command execution
2. **Edit replaces only first match** (`tools/index.ts:186`) — `String.replace()` silently ignores subsequent matches
3. **`approve_all` is a no-op** (`agent-session.ts:533-536`) — TUI shows the option but agent does nothing
4. **Compaction truncates blindly** (`agent-session.ts:738-750`) — keeps head 2 + tail 8 messages, discarding context
5. **Token estimation is naive** (`agent-session.ts:707-721`) — `chars/4` underestimates CJK text by ~2x
6. **No unit tests** — the entire package lacks `__tests__/`

The TUI permission system (`tui-permission-system` spec) already defines the "Yes, allow all edits" UX — the gap is purely on the agent side.

## Goals / Non-Goals

**Goals:**
- Bash tool remains non-blocking; TUI stays responsive during command execution
- Edit tool can replace all occurrences when requested
- `approve_all` persists approval for the session lifetime
- Compaction preserves more context with an LLM summary fallback
- Token estimation handles CJK text reasonably
- Core agent logic has unit test coverage

**Non-Goals:**
- Streaming real-time bash output to the TUI (future enhancement — this change only makes bash async, not streaming)
- Precise tokenizer integration (tiktoken etc.) — improved heuristics are sufficient
- Compaction via external summarization service — use the same model via ko-ai `stream()`
- Integration tests requiring live LLM calls

## Decisions

### D1: Bash async — `spawn` with buffered output

**Choice**: Use `child_process.spawn` wrapped in a Promise, collecting stdout/stderr buffers.

**Alternatives considered**:
- `util.promisify(exec)` — simplest, but same API shape; still no streaming, and inherits `exec`'s shell interpretation + 10MB buffer limit
- `spawn` with real-time `bash_output` events — ideal, but requires TUI changes to render streaming output; scope creep for this fix

**Rationale**: `spawn` gives us non-blocking execution with proper timeout via `AbortController` and clean signal handling. Buffering output (vs streaming) keeps the change contained to `ko-agent`. A follow-up can add `bash_output` events for real-time TUI rendering.

```
┌──────────────┐     spawn()      ┌──────────────┐
│  AgentSession│─────────────────▶│  child proc  │
│  (async)     │◀── Promise ──────│  (detached)  │
│              │   {stdout,stderr} │              │
└──────────────┘                  └──────────────┘
```

### D2: Edit `replace_all` — optional boolean parameter

**Choice**: Add `replace_all?: boolean` to the Edit tool JSON Schema. When true, use `String.prototype.replaceAll()` (or `split(old).join(new)` for safety on special regex chars).

**Alternatives considered**:
- Always replace all — breaking change, current behavior is useful for targeted edits
- Regex-based matching — overcomplicates the interface; the model can use grep + edit for complex patterns

**Rationale**: Backward compatible. The model opts in when it knows there are multiple matches. Default behavior unchanged.

### D3: `approve_all` — per-category session tracking

**Choice**: Add a `Set<ToolPermissionCategory>` called `sessionApprovedCategories` to `AgentSession`. When `approve_all` is received, add the tool's category to the set. `shouldRequestToolPermission` checks this set before requiring permission.

**Alternatives considered**:
- Switch `permissionMode` to `accept_edits` — too coarse; approves ALL write/edit even if user only approved bash
- Per-path tracking (`Map<category, Set<filePath>>`) — more precise but more complex; the TUI spec says "in <dir>/" but implementing path-scoped approval adds significant complexity

**Rationale**: Category-level tracking matches the three permission categories (write, edit, bash). Simple to implement, easy to understand, covers the common case. The "in <dir>" refinement can come later.

```
permissionMode = "default"
sessionApprovedCategories = {}  // initially empty

User clicks "Yes, allow all edits"
  → sessionApprovedCategories.add("edit")
  → sessionApprovedCategories.add("write")

Next edit/write tool call
  → shouldRequestToolPermission("edit", "default")
  → check sessionApprovedCategories.has("edit") → true
  → skip permission dialog
```

### D4: Compaction — keep tool pairs + LLM summary

**Choice**: Two-phase compaction:
1. **Structural pass**: Keep head (first user message) + all complete tool_call/tool_result pairs from the last N turns + tail (last assistant message). This preserves actionable context.
2. **LLM summary pass**: Send discarded messages to the same model via `complete()` (tool-free) to generate a one-paragraph summary. Insert as a synthetic `user` message with `[Context summary]` prefix.

**Alternatives considered**:
- Just increase `keepLast` — delays the problem but doesn't solve it
- Summary-only (no structural preservation) — loses the most recent tool context the model needs

**Rationale**: Tool results are the most expensive context to lose (they contain file contents, command outputs). Preserving recent tool pairs while summarizing older conversation gives the best context/cost tradeoff.

### D5: Token estimation — CJK-aware heuristic

**Choice**: Count CJK characters at 0.5 tokens/char and ASCII/Latin at 0.25 tokens/char (the current `1/4` rate).

**Alternatives considered**:
- Import `tiktoken` or `@anthropic-ai/tokenizer` — adds a dependency and ~500KB to bundle; overkill for a threshold check
- Unicode-aware byte counting — closer to reality but still heuristic

**Rationale**: CJK characters map to 2-3 tokens in most tokenizers. A weighted heuristic (`cjk_chars * 0.5 + other_chars * 0.25`) is significantly more accurate for mixed-language content with zero dependencies.

### D6: Unit tests — Vitest with mock tools

**Choice**: Create `src/__tests__/` with focused test files for each module. Mock the LLM stream for agent loop tests using a simple AsyncIterable.

**Test targets** (in priority order):
1. `tools/index.ts` — `safePath`, `validateSchema`, `checkBashPolicy`, tool execute with mocked fs
2. `tool-permissions.ts` — pure functions, easy to test exhaustively
3. `session-store.ts` — use `os.tmpdir()` for isolated JSONL files
4. `agent-session.ts` — mock `stream()` to return canned events; test loop, permission flow, compaction

## Risks / Trade-offs

- **[Risk] spawn behavior differs from execSync on Windows** → Mitigation: use `shell: true` option in spawn to maintain shell interpretation parity. Add a test for basic cross-platform commands.
- **[Risk] LLM summary call during compaction adds latency** → Mitigation: use `complete()` (non-streaming) with a low max_tokens cap (500). If the call fails, fall back to truncation.
- **[Risk] `sessionApprovedCategories` persists across model switches** → Mitigation: this is intentional — approvals are session-scoped, not model-scoped. Document this behavior.
- **[Risk] `replaceAll` with special regex characters in `old_string`** → Mitigation: use `split(old_string).join(new_string)` instead of `replaceAll` to avoid regex interpretation.
