## Why

ko-tui is already a turn-based Claude-style terminal, but still has **spec debt and behavior gaps** vs Claude Code on **information architecture and key gestures** (tool-summary depth, status-bar density, thinking collapse + stream order, honest permission copy, Esc cancel, narrow-terminal degradation). Archived specs also **conflict** (especially status). This change packages progressive alignment as a **single apply-ready OpenSpec change** without rewriting the agent loop / permission engine / session store and without pixel/symbol cloning — so implementers can apply tasks without re-litigating locked decisions.

Primary references (wayfinder assets):

- `docs/wayfinder/tui-baseline-inventory.md`
- `docs/wayfinder/claude-code-terminal-reference.md`
- Map: [Map: Claude Code–style TUI OpenSpec](https://github.com/hhhyyyy99/koCode/issues/2)

## What Changes

- Define package-level **progressive alignment** and **fidelity A** (IA + key gestures, not visual clone).
- Deepen tool-card collapsed summaries for built-in tools + human-readable unknown/MCP fallback; ban default raw JSON dumps.
- Densify StatusBar runtime/pressure fields; reconcile `tui-status-bar` vs `tui-enhanced-status` under Header / StatusBar / panel split; define narrow-terminal drop priority.
- Lock thinking as default-collapsed under shared expandable-block / `ctrl+o`; require stream-order assistant items; supersede Enter-expand and fixed thinking-first layout.
- Add Esc-cancels-running-turn under text-input focus; keep Alt/Ctrl+Enter newline MUST and Shift+Enter SHOULD.
- Require honest session-scoped `approve_all` copy (especially bash); restatement of three-way permission + focus monopoly.
- Restate draft continuity, required slash command surface, and Esc priority across focus modes.
- SHOULD present compaction notices from existing `compaction_*` events (TUI-only).
- Explicit **empty** agent event-seam list — no `agent-events` / `agent-runtime` delta by default.

## Capabilities

### New Capabilities

- `tui-claude-ia-alignment`: progressive alignment + fidelity A definition; cross-surface non-goals; package acceptance boundaries.

### Modified Capabilities

- `tui-tool-card-realignment`: specialized collapsed summaries, status vocabulary gloss, JSON-dump ban, collapse-by-default IA (glyph clone non-goal).
- `tui-status-bar`: footer MUST/SHOULD field package + narrow drop priority; owns reconciliation vs enhanced-status.
- `tui-enhanced-status`: supersede footer requirements that conflict with Header/StatusBar/panel split.
- `tui-turn-based-conversation`: stream-order items; thinking default collapsed via expandable blocks; supersede Enter-expand + fixed thinking-first; compaction SHOULD.
- `tui-enhanced-input`: Esc cancels running turn; Shift+Enter SHOULD + Alt/Ctrl+Enter MUST newline; Ctrl+C not primary cancel-turn.
- `permission-dialog-semantics`: honest `approve_all` session+category copy (esp. bash); unknown ≠ Create file restated.
- `tui-focus-routing`: Esc priority order; permission / slash / history / transcript-block monopoly restated.
- `tui-input-continuity`: draft preserve + busy-submit MUST restatement for the package.
- `tui-command-panel`: required command set for alignment; stubs not over-claimed; no Claude full catalog mandate as product completeness.
- `tui-tool-output-navigation`: cross-link shared expandable / `ctrl+o` contract; do not re-author active `unify-expandable-transcript-blocks`.

## Impact

- **Primary package**: `packages/ko-tui` (ToolCallCard / summary helpers, StatusBar, Header coexistence, InputBox/App Esc routing, ThinkingBlock presentation, useTurns compaction consumption, PermissionDialog copy).
- **Agent**: default **no** product code; existing events/APIs only (`tool_*`, `thinking_delta`, `message_delta`, `permission_request`, `resolvePermission`, `cancel`/`turn_cancelled`, `compaction_*`, usage/mode pull APIs).
- **OpenSpec**: new change under `openspec/changes/align-tui-claude-code-ia/`; deltas listed above; no `agent-events` delta.
- **Depends on / does not re-litigate**: active `unify-expandable-transcript-blocks` for shared expandable transcript block + `ctrl+o` contract; other active TUI fixes (tool order, slash ranking, etc.) remain independent.
- **Out of this change’s author step**: implementing TUI runtime behavior (implementation is a later apply phase against `tasks.md`).
- **May require** `pnpm bundle` after implementation (not for authoring specs).
