## Context

koCode’s TUI already approximates a Claude Code–style agentic transcript: Turn / `AssistantItem` / `useTurns`, tool cards, thinking blocks, permission focus, slash panel, streaming reduction. Wayfinder research ([Research: ko-tui baseline inventory vs Claude Code–style brief](https://github.com/hhhyyyy99/koCode/issues/3), [Research: Claude Code terminal interaction reference notes](https://github.com/hhhyyyy99/koCode/issues/4)) and grills (#5–#10, #12) locked progressive alignment under **fidelity A** (information architecture + key gestures).

Gaps are presentation and binding depth plus **conflicting archived specs** (thin `tui-status-bar` vs dense `tui-enhanced-status`; Enter-expand thinking; fixed thinking-first order; glyph-as-MUST wording). This design packages those locked decisions into one apply-ready OpenSpec change. **Product implementation is out of the wayfinder map**; this design is the handoff.

## Goals / Non-Goals

**Goals:**

- Progressive alignment on existing Turn / `useTurns` / focus model — single source of truth for timeline.
- Fidelity A acceptance: IA + key gestures; honest semantics; summary-first density.
- Capability deltas that supersede conflicting legacy SHALLs so implementers are not dual-bound.
- Empty agent event-seam list with explicit candidate → not-a-seam mapping.
- tasks.md taxonomy: `[change]` / `[verify]` / `[supersede]` by capability.

**Non-Goals:**

- Pixel/symbol cloning of Claude Code (`✻`/`●`/`💭`/border characters as pass criteria).
- Greenfield rewrite or parallel TimelineEvent source of truth.
- Agent loop / permission engine core / session storage rewrites.
- New providers or new tool types as product features.
- Claude custom statusline script host / PR footer badge as MUST surfaces.
- Project-level / per-command allow-lists; Claude full mode matrix (`plan` / `bypassPermissions` / classifier auto).
- `@` interactive file picker; Ctrl+L clear-chat; session-level thinking master toggle; productizing stub slash commands; Ctrl+C as primary cancel-turn.
- Cross-platform Web/Desktop design-system platformization; brainless/shadcn deps.
- Implementing TUI product code inside the OpenSpec authoring step.

## Decisions

### Progressive alignment + fidelity A

- **MUST** evolve existing Turn / `AssistantItem` / `useTurns` / focus modes.
- **MUST NOT** introduce a parallel timeline model.
- **MUST** accept on structure and behavior (fields, focus ownership, default collapse, key contracts, model feedback paths).
- **MUST NOT** treat Claude glyph / exact English chrome strings / pixel layout as pass criteria.
- **SHOULD** improve readability toward Claude-style IA (honest copy, summary-first cards, dense-but-degradable footer).

Requirement layers in every surface delta:

1. MUST structure  
2. MUST behavior  
3. SHOULD presentation  
4. Non-goals / MUST NOT  

Scenarios assert only observable structure/behavior.

### Capability packaging

| Area | Capability | Posture |
| --- | --- | --- |
| Package | `tui-claude-ia-alignment` (new) | fidelity + non-goals |
| Tools | `tui-tool-card-realignment` | change summaries + JSON ban |
| Status | `tui-status-bar` + `tui-enhanced-status` | densify footer; supersede conflicting enhanced-status footer MUST |
| Timeline / thinking | `tui-turn-based-conversation` | stream order; collapsed thinking; compaction SHOULD |
| Input | `tui-enhanced-input` | Esc cancel; newline bindings |
| Permission | `permission-dialog-semantics` | honest `approve_all` copy |
| Focus | `tui-focus-routing` | Esc priority restatement |
| Continuity | `tui-input-continuity` | verify-heavy restatement |
| Slash | `tui-command-panel` | required set; no full Claude catalog as completeness |
| Expand navigation | `tui-tool-output-navigation` | reference expandable contract; no re-author of active change |
| Header | design/tasks verify only | no delta unless gap appears at apply |

### Tool render contract

- Status vocabulary remains `running | done | error` (`done` = success gloss).
- Specialized collapsed summaries for `read` / `edit` / `write` / `bash` / `grep` / `find` / `ls` + human-readable unknown/MCP fallback.
- Collapsed by default; detail via shared expandable-block `ctrl+o`.
- MUST NOT default-render full tool input/envelope via `JSON.stringify`.
- Single `ToolCallCard` behavioral surface (helpers may evolve in place; no mandatory `renderers/<tool>.ts` tree).
- Glyph/`●`/`⎿` exact parity is non-goal under fidelity A (supersede glyph-as-MUST wording).

### Status chrome IA

Three-layer split:

1. **Header** — product/version, model, cwd; window capacity may coexist.
2. **StatusBar (footer)** — mode, running, context usage pressure, shortcuts MUST; cost + git SHOULD.
3. **`/status` / `/cost` / `/context` panels** — deep detail; not footer MUST.

Narrow drop priority (first dropped → last): git → cost → context long form → shortcuts long → mode long → running (never drop both running and mode silently).

Data: existing session pull APIs; git = TUI-local SHOULD; **no new AgentSessionEvent**.

### Thinking + streaming + compaction

- Thinking: distinct block, default collapsed, secondary weight, shared expandable keys with tools.
- Render `Turn.assistant.items` in stream/arrival order; contiguous same-kind deltas merge; intervening kinds open new items.
- Supersede: Enter expands thinking; fixed thinking→tools→text layout.
- Streaming acceptance is **observable** only (merge, pair tools by id, cancel keeps partial) — no µs/FPS benchmarks.
- Compaction: **SHOULD** show a visible system/transcript notice when existing `compaction_start` / `compaction_end` fire; TUI-only consumption.

### Input / slash / focus

| Gesture | Posture |
| --- | --- |
| Enter submit | MUST |
| Newline without submit | MUST (Alt/Ctrl+Enter + Ctrl+J keep); Shift+Enter SHOULD primary Claude-aligned |
| Esc cancel running turn | MUST when text-input focus + running + no higher focus owner |
| `/quit` `/exit` | MUST explicit exit; Ctrl+C may remain process exit — not package cancel-turn |
| `/clear` | MUST clear conversation (not Ctrl+L) |
| `@path` Tier-1 text route | MUST; picker deferred |
| Draft preserve / busy submit | MUST (verify-heavy) |

Esc priority (first match wins): blocking modal → slash → history-search → running+input cancel → existing bare/double-Esc paths.

Required slash commands (real behavior): `/help`, `/clear`, `/compact`, `/model`, `/models`, `/status`, `/context`, `/cost`, `/permissions`, `/resume`, `/branch`, `/rewind`, `/theme`, `/session`, `/quit`, `/exit`. Stubs may remain listed but MUST NOT be claimed as full product behavior.

### Permission UI

- Actions: `approve` / `approve_all` / `deny` only.
- `approve_all` = rest of **session** + **category** (`edit`/`write`/`bash`/`unknown`); copy MUST match (no “always in this project” for bash).
- Focus `permission` monopoly: Up/Down, Enter, 1–3, Esc=deny.
- Deny → error tool result to model; overlay not Turn row.
- Modes remain `default | accept_edits | auto`; engine frequency table verify-only.
- No `permission_response` emit MUST.

### Event seams (empty)

Proposed seam patches: **`[]`**.

| Candidate | Disposition | Existing path |
| --- | --- | --- |
| Status chrome fields | Not a seam | `getPermissionMode`, running state, `getModel`, `getCwd`, `getUsage` / context / stats |
| Git branch footer | Not a seam | TUI-local git read (SHOULD) |
| Esc cancel turn | Not a seam | `AgentSession.cancel()` → `turn_cancelled` |
| Thinking / streaming presentation | Not a seam | `thinking_delta` / `message_delta` / tool pair events |
| Tool human-readable summaries | Not a seam | `tool_start` / `tool_end` `{ isError, content }` + name/input |
| Permission dialog | Not a seam | `permission_request` + `resolvePermission` |
| `permission_response` emit | Out / not required | type may remain unused by live path |
| Compaction rows | Not a seam | existing `compaction_*`; TUI consumption gap only |
| Usage push events | Not a seam | pull APIs for footer |
| Second cancel API | Out | existing cancel sufficient |

Hard non-goals: rewrite agent loop / permission engine / session store; expand modes or action strings; new providers/tool types solely for IA; permission as timeline row.

**ADR:** none for this package (empty seam list). If implementation discovers a true agent contract break, open a separate ADR then.

### Relationship to active OpenSpec changes

- **`unify-expandable-transcript-blocks`**: source of truth for expandable transcript block keys, focus mode, and `ctrl+o`. This change **references** that contract for tools + thinking; does **not** re-author it. Apply order: expandable change should land or remain compatible; this package’s thinking scenarios assume Ctrl+O expandable model.
- **`fix-tool-output-order-and-ctrl-o`** and other active TUI fixes: do not re-litigate stream order / tool navigation basics; this package layers fidelity-A summary depth and supersedes residual Enter/glyph debt.
- No dependency on agent-side open changes.

### Implementation sequencing (later apply)

1. Spec-only already complete in this change directory.  
2. Tools summaries + JSON ban.  
3. StatusBar densify + enhanced-status supersede + narrow policy.  
4. Thinking/stream-order supersedes (likely mostly verify if expandable already applied) + compaction SHOULD.  
5. Esc cancel + newline SHOULD.  
6. Permission honest copy.  
7. Focus / continuity / command verify matrix.  
8. `pnpm typecheck && pnpm test` (+ `pnpm bundle` if runtime entry affected).  
9. `openspec validate --all --strict`.

Agent tasks default **none**. Any agent code task requires a documented surprise blocker.

## Risks / Trade-offs

- **[Risk] Dual conflicting SHALLs remain if supersede is incomplete** → Mitigation: every known conflict (status density, Enter-expand, thinking-first, glyph-as-MUST, bash allow-all project wording) has an explicit MODIFIED requirement.
- **[Risk] Expandable active change not yet archived** → Mitigation: design references it; tasks mark expandable work as dependency/verify, not duplicate.
- **[Risk] Implementers re-open fidelity as pixel clone** → Mitigation: package capability states fidelity A non-goals; scenarios ban glyph pass criteria.
- **[Trade-off] Compaction is SHOULD not MUST** → Accept residual silence if capacity is tight; still consumes existing events only.
- **[Trade-off] Empty seam list** → If a real agent gap appears at apply, stop and ADR rather than silent protocol drift.
