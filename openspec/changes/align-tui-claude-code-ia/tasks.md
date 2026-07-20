## 0. Package skeleton

- [x] 0.1 [spec] Create `openspec/changes/align-tui-claude-code-ia/` with `.openspec.yaml`, `proposal.md`, `design.md`, `tasks.md`.
- [x] 0.2 [spec] Author capability deltas listed in proposal (new + modified).
- [x] 0.3 [verify] Run `openspec validate align-tui-claude-code-ia --strict` and `openspec validate --all --strict`.

## 1. Package fidelity (`tui-claude-ia-alignment`)

- [x] 1.1 [change][impl] Keep progressive alignment: evolve Turn / `useTurns` / focus only — no parallel TimelineEvent model.
- [x] 1.2 [verify] Acceptance scenarios assert IA + gestures only; no glyph/string clone pass criteria.
- [x] 1.3 [verify] Map out-of-scope items remain non-implemented (statusline script host, PR badge, full mode matrix, `@` picker, Ctrl+L clear-chat, etc.).

## 2. Tools (`tui-tool-card-realignment`)

- [x] 2.1 [change][impl] Specialized collapsed summaries for `read` / `edit` / `write` / `bash` / `grep` / `find` / `ls`.
- [x] 2.2 [change][impl] Human-readable unknown / MCP fallback (no default `JSON.stringify` of full input/envelope).
- [x] 2.3 [change][impl] Edit collapsed summary includes change scale; expand still shows numbered diff.
- [x] 2.4 [change][impl] Bash collapsed summary is short gist — not full stdout as primary summary.
- [x] 2.5 [verify] Status vocabulary only `running | done | error` (`done` = success).
- [x] 2.6 [verify] Default collapsed; `ctrl+o` expand under expandable-block rules; errors surface error gist.
- [x] 2.7 [supersede] Drop glyph/`●`/`⎿` exact-clone MUST wording from acceptance (fidelity A).
- [x] 2.8 [verify] Tests: ToolCallCard / summary helpers cover the 10 tool scenarios in the tool grill.

## 3. Status chrome (`tui-status-bar` + `tui-enhanced-status`)

- [x] 3.1 [change][impl] StatusBar MUST: permission mode, running/task state, context usage pressure, shortcuts hint.
- [x] 3.2 [change][impl] StatusBar SHOULD: abbreviated session cost + git branch when width allows (TUI-local git OK).
- [x] 3.3 [verify] Header still shows product/version, model, cwd (window capacity may coexist).
- [x] 3.4 [change][impl] Narrow-terminal drop priority: git → cost → context long → shortcuts long → mode long → running last; never drop both running and mode.
- [x] 3.5 [supersede] Remove `tui-enhanced-status` footer MUSTs for session id / full token in-out lines / model-required-in-footer when Header owns model.
- [x] 3.6 [verify] Deep detail remains in `/status` `/cost` `/context` panels — not footer MUST.
- [x] 3.7 [verify] No new agent events for status chrome; pull existing session APIs only.
- [x] 3.8 [verify] Footer may yield/hide during permission (SHOULD).

## 4. Thinking + turn timeline (`tui-turn-based-conversation`)

- [x] 4.1 [supersede] Replace Enter-expands-thinking with expandable-block / `ctrl+o` contract (align with `unify-expandable-transcript-blocks`).
- [x] 4.2 [supersede] Replace fixed thinking→tools→text layout with stream/arrival order of `Turn.assistant.items`.
- [x] 4.3 [verify] Thinking default collapsed, secondary/dimmed; no auto-expand while streaming.
- [x] 4.4 [verify] Contiguous `thinking_delta` / `message_delta` merge; intervening kinds open new items.
- [x] 4.5 [verify] Tool start/end pair by id; duplicate `tool_end` does not create a new card.
- [x] 4.6 [verify] Mid-stream Esc cancel keeps partial work + cancelled semantics.
- [x] 4.7 [change][impl] SHOULD: visible compaction notice/row when `compaction_start` / `compaction_end` fire (TUI-only; existing events).
- [x] 4.8 [verify] No micro-benchmark acceptance; no new agent events for thinking/streaming/compaction presentation.

## 5. Input / slash / focus

### 5.a Input (`tui-enhanced-input`)

- [x] 5.1 [verify] Enter submits when focus allows.
- [x] 5.2 [change][impl] Document/support Shift+Enter as SHOULD primary newline where terminal delivers it.
- [x] 5.3 [verify] Alt/Option+Enter and Ctrl+Enter (and Ctrl+J if present) still insert newline without submit.
- [x] 5.4 [change][impl] Esc cancels running turn via `session.cancel()` when focus is text-input and no higher owner.
- [x] 5.5 [verify] Ctrl+C is not redefined as primary cancel-turn; `/quit` `/exit` remain explicit exit.
- [x] 5.6 [verify] Prefixes `!` `#` `/` `@` + plain prompt still route; `@` Tier-1 text only (no picker).

### 5.b Continuity (`tui-input-continuity`)

- [x] 5.7 [verify] Unsent draft survives running start/end and permission open/resolve.
- [x] 5.8 [verify] Busy Enter rejects/notifies visibly and does not drop draft.

### 5.c Focus (`tui-focus-routing`)

- [x] 5.9 [change][spec/impl] Esc priority: modal → slash → history-search → running cancel → existing bare/double-Esc.
- [x] 5.10 [verify] In `transcript-block`, Esc returns to input (does not cancel turn).
- [x] 5.11 [verify] Modal focus blocks global shortcuts including `ctrl+o`.

### 5.d Slash (`tui-command-panel`)

- [x] 5.12 [verify] `/` opens panel; filter; Up/Down; Enter fill-or-run; Esc dismiss.
- [x] 5.13 [verify] Required command set discoverable with real handlers: help, clear, compact, model(s), status, context, cost, permissions, resume, branch, rewind, theme, session, quit/exit.
- [x] 5.14 [supersede] Do not treat full Claude catalog / all stubs as product completeness MUST for this package.

## 6. Permission (`permission-dialog-semantics`)

- [x] 6.1 [verify] Three-way `approve` / `approve_all` / `deny`; modes `default | accept_edits | auto` only.
- [x] 6.2 [change][impl] Honest `approve_all` copy = session + category; bash must not imply project-level “always allow”.
- [x] 6.3 [verify] Esc = deny; focus monopoly Up/Down/Enter/1–3/Esc; deny → error tool result.
- [x] 6.4 [verify] Overlay only (not Turn row); unknown title ≠ Create file; edit/write preview SHOULD without raw envelope dump.
- [x] 6.5 [verify] No `permission_response` emit MUST; Shift+Tab mode cycle when not in permission focus.

## 7. Expandable-block dependency

- [x] 7.1 [verify] Do **not** re-author `unify-expandable-transcript-blocks`; reference its keys/focus/`ctrl+o` contract.
- [x] 7.2 [verify] Tool + thinking share expandable navigation; hints match real binding.
- [x] 7.3 [verify] `tui-tool-output-navigation` remains compatible (focus marker, expand/collapse, long-output scannability).

## 8. Agent seams

- [x] 8.1 [verify] Default **no** agent product tasks; no `agent-events` / `agent-runtime` delta.
- [x] 8.2 [verify] Cancel uses existing `cancel()`; permission uses `permission_request` + `resolvePermission`; compaction uses existing `compaction_*`.
- [x] 8.3 [change] Only if a surprise agent contract blocker appears: stop, document, optional ADR — do not silently invent events.

## 9. Validation (apply phase)

- [x] 9.1 [verify] `pnpm --filter @kocode/ko-tui test`
- [x] 9.2 [verify] `pnpm typecheck`
- [x] 9.3 [verify] `pnpm test`
- [x] 9.4 [verify] `openspec validate --all --strict`
- [x] 9.5 [verify] `pnpm bundle` if runtime entry / packaged CLI surface changed
