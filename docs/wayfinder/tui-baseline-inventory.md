# ko-tui baseline inventory vs Claude Code–style brief

**Map:** [Map: Claude Code–style TUI OpenSpec](https://github.com/hhhyyyy99/koCode/issues/2)  
**Ticket:** [Research: ko-tui baseline inventory vs Claude Code–style brief](https://github.com/hhhyyyy99/koCode/issues/3)  
**Scope:** `packages/ko-tui` + agent event / session APIs it already consumes. No product code changes.  
**Fidelity lens:** information architecture + key gestures (not pixel/symbol cloning).  
**Strategy lens:** progressive alignment on existing Turn / `useTurns` (no parallel TimelineEvent source of truth).

Sources are local primary code and existing OpenSpec capability specs under `openspec/specs/tui-*`.

---

## 1. Entry points and component map

### Entry

| Piece | Path | Role |
| --- | --- | --- |
| TUI bootstrap | `packages/ko-tui/src/run.ts` | `ink.render(<ThemeProvider><App session/></ThemeProvider>)`; `exitOnCtrlC: true` (process exit, not turn cancel) |
| Public export | `packages/ko-tui/src/index.ts` | package surface |
| Root UI | `packages/ko-tui/src/App.tsx` (~612 LOC) | event subscription, focus, modals, submit routing, layout |

### Layout (top → bottom)

1. `Header` — product/version, `provider/model`, context window size, cwd  
2. `Conversation` → `useTurns` → `Turn` list (+ `Welcome` when empty)  
3. Notifications (ephemeral text)  
4. Blocking overlays: `PermissionDialog`, `StatusPanel`, model hint box, `ThemePanel`, `RewindDialog`, `SessionPanel`  
5. `InputBox`  
6. `CommandPanel` (only when slash mode)  
7. `StatusBar` — shortcuts hint + running/permission mode  

### Component clusters

| Cluster | Files | Notes |
| --- | --- | --- |
| Conversation / timeline | `Conversation.tsx`, `Turn.tsx`, `types.ts`, `useTurns.ts`, `UserBubble.tsx`, `AssistantBlock.tsx`, `ThinkingBlock.tsx`, `Markdown.tsx` | Turn = user message + ordered assistant items |
| Tools | `ToolCallCard.tsx` | Human-readable titles/summaries; expand via ctrl+o |
| Input | `InputBox.tsx`, `input-buffer.ts`, `input-history.ts`, `input-prefix.ts` | Multi-line, history search, prefix routes |
| Slash | `CommandPanel.tsx`, `commands.ts` | Fuzzy filter + keyboard select |
| Permission | `PermissionDialog.tsx` | Focus monopoly when active |
| Status / chrome | `StatusBar.tsx`, `Header.tsx`, `StatusPanel.tsx` | StatusBar thin; richer data in Header + `/status` panel + slash reports |
| Focus / layout | `focus.ts`, `layout.ts` | Single focus owner for keys |
| Theme / session UX | `theme.ts`, `ThemePanel.tsx`, `SessionPanel.tsx`, `RewindDialog.tsx`, `Welcome.tsx` | Adjacent to core chat IA |

### Focus modes (`focus.ts`)

`input` · `slash` · `status-modal` · `model-modal` · `theme-modal` · `session-modal` · `permission` · `rewind-confirm` · `tool-output` · `transcript-block` · `history-search`

Rules already encoded: modal vs text-input vs global-shortcut eligibility; restore-after-blocking; ctrl+o expandable block toggle shared by thinking + tools.

---

## 2. Data flow

```text
User keystrokes
  → InputBox / App focus router
  → parseInputRoute (! shell | # memory | / slash | @ file_reference | prompt)
  → AgentSession.prompt | execShell | saveMemory | command handler | resolvePermission
  → AgentSession emits AgentSessionEvent
  → App listener: append events[]; side-effects (running, model, permissionMode, permission UI, session_resumed rebuild)
  → Conversation(events) → useTurns → Turn[]
  → Turn maps AssistantItem → UserBubble | ThinkingBlock | AssistantBlock | ToolCallCard
```

### Turn model (`types.ts`)

- `Turn`: `userMessage`, `assistant.items[]`, `status` (`streaming` | `complete` | `error`), timestamps, optional `errorMessage`
- `AssistantItem`: `text` | `thinking` (default `collapsed: true` in reducer) | `tool` (`ToolCallState`)
- `ToolCallState.status`: `running` | `done` | `error` (no separate `pending` / `success` names)

### Events consumed by `useTurns.processEvent`

| Event | Effect |
| --- | --- |
| `user_message` | new Turn |
| `turn_start` | set `startedAt` |
| `message_delta` | merge/append text item |
| `thinking_delta` | merge/append thinking item (`collapsed: true`) |
| `tool_start` / `tool_end` | pair tool items; dedupe running same id |
| `turn_end` | complete + `completedAt` |
| `turn_cancelled` | complete with “Turn cancelled” |
| `shell_start` / `shell_end` | synthetic turn + bash tool card |
| `agent_error` | error on last turn or synthetic error turn |

**Ignored by reducer (handled only in App or not at all in timeline):**  
`message_start`, `message_end`, `thinking_start`, `thinking_end`, `compaction_start`, `compaction_end`, `model_changed`, `thinking_level_changed`, `permission_mode_changed`, `permission_request`, `permission_response`, `memory_saved`.

### Events / state App handles outside the timeline

- `turn_start` / `turn_end` / `turn_cancelled` → `running`
- `model_changed` → header model
- `permission_mode_changed` → status bar mode
- `permission_request` → focus `permission` + `PermissionDialog`
- `session_resumed` → rebuild `events` via `messagesToEvents`

### Agent session APIs already used by TUI (no new seams required for basic chrome)

- `getModel`, `getCwd`, `getPermissionMode`, `setPermissionMode`
- `getUsage`, `getUsageByModel`, `getSessionStats`, `getContextBreakdown`
- `prompt`, `compact`, `execShell`, `saveMemory`, `resolvePermission`
- `rewindLastTurn`, branch/resume session helpers, `listSavedSessions`

**Not observed as a first-class TUI API:** live git branch name for status chrome (only conversation-branch, not VCS branch). Git mention exists in system-prompt construction, not status bar.

---

## 3. Capabilities that already approximate Claude Code style

| Surface | Baseline evidence | Approx. level |
| --- | --- | --- |
| Single-column turn stream | `Conversation` + `Turn`; OpenSpec `tui-turn-based-conversation` | Strong |
| User / assistant separation | `❯` user bubble; markdown assistant | Strong |
| Tool human-readable cards | `displayToolName`, `formatToolParams`, `toolTitle`, `toolSummary`; `●/✓/✗` + `⎿`; OpenSpec `tui-tool-card-realignment` | Strong for built-ins; not full specialized renderers |
| Thinking blocks | Default collapsed preview; ctrl+o expand shared with tools | Present; glyph/IA may differ from Claude Code |
| Permission prompt | 3 options (once / session-or-always / deny); Up/Down/Enter/1–3/Esc; focus monopoly | Strong |
| Slash discovery | `filterCommands` + `CommandPanel`; many commands beyond the brief’s short list | Strong |
| Input continuity | Draft kept while `running`; busy submit notifies; tests in `InputBox` / focus | Strong |
| Input prefixes | `!` shell, `#` memory, `/` slash, `@` path→prompt text (not picker UI) | Partial vs “@ file picker” brief |
| Streaming merge | `mergeDelta` on text/thinking; tool start/end pairing; dedup running tool | Strong structurally |
| Expandable transcript | Unified thinking+tool keys; ctrl+o; overflow hints | Strong |
| Status / cost / context **as commands/panels** | `/cost`, `/context`, `/status` + `StatusPanel` tabs | Strong off-chrome |
| Header session chrome | model + context window size + cwd | Partial vs dense footer status |
| Theme / session branch / resume / rewind | panels + commands | Adjacent product surface (keep under progressive alignment) |
| Turn completion marker | playful `✻ Cooked/Baked/... for Ns` | Present; tone is product-specific |

### Slash commands already registered (excerpt)

`/help` `/clear` `/compact` `/resume` `/branch` `/quit` `/exit` `/context` `/cost` `/diff` `/rewind` `/status` `/session` `/model` `/models` `/config` `/init` `/permissions` `/theme` `/review` `/doctor` `/export` `/skills` `/feedback`

Brief’s short list is largely covered; several extras already exist (some stubs like `/diff` “coming soon”).

### Input gestures baseline

| Gesture | Baseline |
| --- | --- |
| Enter submit | Yes (`inputKeyAction`) |
| Newline | Meta+Enter or Ctrl+Enter (`\n`) — **not** documented Shift+Enter in `inputKeyAction` |
| Ctrl+C | `exitOnCtrlC: true` → **exit app**, not cancel-in-flight turn |
| Ctrl+L clear screen | Not found as TUI clear-screen |
| `/` slash menu | Yes |
| `@` file reference | Text route only (injects “Referenced file: …” into prompt) — no picker |
| Ctrl+R history search | Yes |
| Ctrl+O expand block | Yes |
| Shift+Tab permission mode cycle | Yes |
| Double Esc rewind confirm | Yes |

### Permission options baseline

Maps to `resolvePermission(..., "approve" | "approve_all" | "deny")` with copy specialized for bash vs edit/write vs unknown — already close to Claude Code “once / session / deny” IA.

---

## 4. Gaps vs full OpenSpec alignment package

Mapped to the locked package surfaces. Labels: **Gap** (needs decision/spec change), **Partial** (exists but IA incomplete), **Mostly met** (likely verify-only), **Seam?** (may need agent data).

### 4.1 Timeline / Turn presentation semantics

| Item | Status | Notes |
| --- | --- | --- |
| Turn grouping | Mostly met | Stable model; do not replace with TimelineEvent |
| Ordering text/thinking/tool | Mostly met | Item push order = stream order |
| Compaction / system timeline rows | Gap | `compaction_*` ignored in reducer — no timeline affordance |
| Permission as timeline event | Gap / out of turn model | Overlay only; may be correct under progressive alignment |
| Completion marker tone/fields | Partial | Exists; whether cost/tokens appear on completion is undecided |
| Error presentation | Partial | `agent_error` + tool error summaries |

### 4.2 Tool human-readable render contract

| Item | Status | Notes |
| --- | --- | --- |
| Ban default raw JSON | Mostly met | Params summarized; unknown tools title-case name + first param |
| Specialized read/edit/write/bash | Partial | Summaries exist; edit lacks +/- line counts in collapsed summary; bash summary is raw output snippet |
| grep/find/ls | Partial | Named display only; weak result summaries |
| MCP / unknown fallback | Partial | Generic capitalization fallback only |
| Status vocabulary | Partial | `running/done/error` vs brief’s `pending/running/success/error` — naming decision for OpenSpec |
| Expanded detail | Mostly met | Diff/line numbers/ctrl+o |
| Per-tool renderer modules | Gap vs plan tree | Single `ToolCallCard` — progressive alignment may keep one module with contract tests |

### 4.3 Thinking presentation

| Item | Status | Notes |
| --- | --- | --- |
| Default collapsed | Mostly met | Reducer sets `collapsed: true`; UI expands via expanded set |
| Preview + toggle | Mostly met | 80-char preview; ctrl+o |
| Claude Code IA parity | Partial | Uses `💭` / “Thinking” — fidelity A does not require glyph match; copy/structure still grills |
| Multi-block coexistence | Mostly met | Multiple thinking items possible if non-contiguous |

### 4.4 Permission UI

| Item | Status | Notes |
| --- | --- | --- |
| Options + keyboard monopoly | Mostly met | Strong baseline + tests |
| Feed deny to model | Mostly met (agent-side contract; TUI calls resolve) | Spec should restate as MUST |
| Visual IA vs Claude Code | Partial | Title/options copy differs; fidelity A = structure not clone |
| `accept_edits` / `auto` interaction with prompt frequency | Partial | Mode cycle exists; dialog appearance rules live in agent permission engine (out of rewrite scope) |

### 4.5 Input gestures & draft rules

| Item | Status | Notes |
| --- | --- | --- |
| Draft across running/modals | Mostly met | Core continuity present |
| Enter / multiline | Partial | Newline binding ≠ brief’s Shift+Enter |
| Stop current task | Gap | No first-class cancel-turn gesture in TUI; Ctrl+C exits |
| Ctrl+L clear | Gap | Not implemented (or not as clear-screen) |
| `@` file picker | Gap / defer candidate | Route exists; picker UI does not |
| External editor / history | Present product extras | Keep; not blockers |

### 4.6 Slash command package surface

| Item | Status | Notes |
| --- | --- | --- |
| Fuzzy + keyboard select | Mostly met | |
| Required command set | Mostly met | Brief list subset of existing; packaging should mark verify-only vs stub |
| Stubs | Partial | e.g. `/diff` placeholder — OpenSpec should not silently claim full behavior |

### 4.7 Status bar fields & narrow terminal

| Item | Status | Notes |
| --- | --- | --- |
| Persistent bottom bar | Mostly met | Exists under input |
| Model / context% / cost / branch / cwd / task | Gap on StatusBar | Model/cwd/context window on **Header**; cost/context via **commands/panel**; **no git branch** in chrome; StatusBar only shortcuts + running/mode |
| Narrow-width degradation | Partial | Width used for padding/separators; no field-priority drop policy on a dense bar |
| Spec conflict signal | Gap | `openspec/specs/tui-status-bar` (thin bar) vs `tui-enhanced-status` (dense bar with model/tokens/session id) — OpenSpec packaging must reconcile |

### 4.8 Streaming / performance observable constraints

| Item | Status | Notes |
| --- | --- | --- |
| Delta merge not per-token components | Mostly met | State merge in `useTurns` |
| Tool pair stability / no duplicate end | Mostly met | Tests around order/dedup exist historically |
| Long transcript / many tools | Partial | No explicit virtualization; events array grows unbounded in App state — acceptance should be behavioral, not microbench |
| Compaction UX while streaming | Gap | Events ignored in timeline |

### 4.9 Minimal agent event seams

| Candidate | Need? | Notes |
| --- | --- | --- |
| Usage/cost/context for chrome | Likely **no new event** | Pull APIs already exist; StatusBar can poll/read on render or on `turn_end` |
| Git branch for status | **Seam or TUI-only** | No session API today; pure TUI `git` read possible without agent change |
| Cancel-turn signal | **Seam if required** | Need agent cancel API + TUI binding; not inventoried as existing TUI control |
| Richer tool result metadata (e.g. +/- counts, pass/fail tests) | Optional seam | Today summaries parse `content` strings / input fields only |
| Compaction timeline | Optional | Events already emitted; TUI ignore is presentation choice |
| Thinking level in chrome | Optional | `thinking_level_changed` exists; not shown |

**Hard non-goals confirmed by code boundaries:** permission engine, agent loop, session store are behind `AgentSession` methods — progressive alignment should not rewrite them.

---

## 5. What must not be rewritten (progressive alignment anchors)

Treat as stable seams unless a later grill proves a local rewrite is cheaper than evolution:

| Anchor | Why |
| --- | --- |
| `Turn` / `AssistantItem` / `ToolCallState` in `types.ts` | Locked timeline model |
| `useTurns.processEvent` + `mergeDelta` | Event→view reducer; heavy test coverage |
| `focus.ts` focus ownership model | Prevents key-routing regressions |
| Permission resolve path (`PermissionDialog` → `session.resolvePermission`) | Safety-critical |
| Input draft buffer + busy-submit behavior | Continuity invariants |
| Expandable transcript block key model (thinking+tool) | Recently unified behavior |
| Session test isolation (`KOCODE_SESSIONS_DIR`) | Repo rule |
| Package dependency direction `ko-ai → ko-agent → ko-tui → ko-cli` | Architecture |
| Existing test files as regression net | Prefer extend over replace: `useTurns`, `ToolCallCard`, `PermissionDialog`, `InputBox`, `focus`, `commands`, `ThinkingBlock`, `turnCompletion`, etc. |

**Prefer evolve-in-place:** `ToolCallCard`, `StatusBar`, `Header`, `ThinkingBlock`, `commands` list, `App` layout composition.

**Do not greenfield:** second timeline store, brainless/shadcn, Web design system, agent loop.

---

## 6. Existing OpenSpec surface (implementation already partially specified)

Many archived TUI capabilities already live under `openspec/specs/`:

- Conversation: `tui-turn-based-conversation`, `tui-turn-completion-marker`
- Tools: `tui-tool-card-realignment`, `tui-tool-output-navigation`
- Input: `tui-enhanced-input`, `tui-input-continuity`, `tui-input-history`, `tui-input-prefix-system`, `tui-command-panel`
- Permission: `tui-permission-system`, `tui-permission-modal-flow`, `permission-dialog-semantics`
- Status: `tui-status-bar`, `tui-enhanced-status`, `tui-status-panel`, `tui-header`, `tui-cost-tracking`, `tui-context-visualization`
- Other: `tui-focus-routing`, `tui-theme-system`, `tui-syntax-highlight`, …

**Implication for destination OpenSpec change:** this is less “write specs from zero” and more **reconcile + delta** conflicting or outdated requirements (especially status bar density) under the locked Claude Code IA fidelity and progressive alignment strategy.

Active (non-archive) changes observed at research time were small fixes (`fix-slash-command-*`, `fix-tool-output-order-and-ctrl-o`, etc.) — not a full Claude Code alignment change yet.

---

## 7. Suggested inputs to downstream tickets (not decisions)

These are inventory pointers for later grills/research — not resolutions:

1. **Tool grill:** lock summary templates + status enum mapping on top of `ToolCallCard` rather than new component tree.  
2. **Status bar grill:** resolve Header vs StatusBar vs `/status` split; reconcile `tui-status-bar` vs `tui-enhanced-status`; decide git branch source.  
3. **Input grill:** Shift+Enter vs current newline; cancel-turn vs exit; whether `@` picker is in-package or deferred.  
4. **Permission grill:** mostly verify-only + copy/IA acceptance scenarios.  
5. **Thinking/streaming grill:** default collapsed stays; define observable streaming MUST/SHOULD; compaction visibility.  
6. **Seam grill:** start from “empty seam list” and only add cancel-turn / git / richer tool metadata if grills demand.  
7. **Packaging grill:** one change that **deltas** existing `tui-*` specs rather than inventing a parallel taxonomy; mark verify-only tasks for strong baselines.

---

## 8. Evidence index (primary paths)

- `packages/ko-tui/src/App.tsx`, `run.ts`, `focus.ts`, `types.ts`, `useTurns.ts`
- `packages/ko-tui/src/ToolCallCard.tsx`, `ThinkingBlock.tsx`, `Turn.tsx`, `Conversation.tsx`
- `packages/ko-tui/src/InputBox.tsx`, `input-prefix.ts`, `commands.ts`, `CommandPanel.tsx`
- `packages/ko-tui/src/PermissionDialog.tsx`, `StatusBar.tsx`, `Header.tsx`, `StatusPanel.tsx`
- `packages/ko-agent/src/events.ts`, `agent-session.ts` (usage/context/permission APIs)
- `packages/ko-tui/src/__tests__/*` (behavior locks)
- `openspec/specs/tui-*` (prior requirements; some Purpose still “TBD” from archives)

---

## 9. One-line baseline verdict

**ko-tui is already a turn-based Claude-ish agent TUI with real tool cards, thinking, permission focus, slash, and streaming reduction; the largest IA gaps for the locked OpenSpec package are dense status chrome, a few input gestures (stop/clear/newline binding), tool-summary specialization depth, compaction/system timeline rows, and reconciling pre-existing conflicting status specs — not a greenfield rewrite.**
