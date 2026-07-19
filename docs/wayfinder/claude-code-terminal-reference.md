# Claude Code terminal interaction reference notes

**Map:** [Map: Claude Code–style TUI OpenSpec](https://github.com/hhhyyyy99/koCode/issues/2)  
**Ticket:** [Research: Claude Code terminal interaction reference notes](https://github.com/hhhyyyy99/koCode/issues/4)  
**Fidelity:** A — information architecture + key gestures; **not** pixel/symbol cloning.  
**Role:** primary *behavioral* reference for the destination OpenSpec. brainless is **not** a terminal authority (layering inspiration only).

## Confidence legend

| Tag | Meaning |
| --- | --- |
| **Doc** | Stated in official Claude Code docs (`code.claude.com/docs`) |
| **Doc-UI** | Official docs describe UI chrome/controls (status badges, menus, dialogs) |
| **Inferred** | Reasonable product inference from docs architecture; **not** a hard OpenSpec MUST without further evidence |

Primary sources (fetched 2026-07-19):

- [Interactive mode](https://code.claude.com/docs/en/interactive-mode)
- [Customize keyboard shortcuts](https://code.claude.com/docs/en/keybindings)
- [Choose a permission mode](https://code.claude.com/docs/en/permission-modes)
- [Configure permissions](https://code.claude.com/docs/en/permissions)
- [Customize your status line](https://code.claude.com/docs/en/statusline)
- [Commands](https://code.claude.com/docs/en/commands)
- [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)
- [Tools reference](https://code.claude.com/docs/en/tools-reference)
- [Quickstart](https://code.claude.com/docs/en/quickstart)

---

## 1. Conversation timeline shape

**Doc / Doc-UI**

- Interactive terminal is a **single-column session**: user prompts and assistant work stream in one vertical transcript. ([How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works), [Interactive mode](https://code.claude.com/docs/en/interactive-mode))
- Work proceeds as an **agentic loop**: gather context → take action (tools) → verify; user can interrupt mid-loop. ([How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works))
- Timeline content classes that matter for IA:
  - **User message** (prompt)
  - **Assistant text** (markdown-capable responses; syntax highlighting theme-toggle exists inside `/theme`)
  - **Tool activity** (detailed in transcript viewer; default view collapses some MCP chatter)
  - **Errors / cancellations** via interrupt (`Esc` stops mid-turn; work so far is kept)
  - **System-ish chrome outside the pure chat stream**: permission dialogs, help panel, `/btw` overlay, task list, session recap, PR footer badge
- **Transcript viewer** (`Ctrl+O`): expands detailed tool usage and execution; shows timestamp and model on assistant messages; expands MCP calls that otherwise collapse. ([Interactive mode](https://code.claude.com/docs/en/interactive-mode))
- In default renderer transcript, `Ctrl+E` toggles “show all content”. ([Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Keybindings](https://code.claude.com/docs/en/keybindings))

**Inferred (for OpenSpec, treat as soft)**

- User-visible timeline is **turn-oriented** in practice (prompt → assistant actions → done), even when docs emphasize the agentic loop rather than a formal “Turn” type.
- Compaction and context management affect *what remains in context*, not necessarily a dedicated timeline row—`/context` and `/compact` are the user-facing controls. ([Commands](https://code.claude.com/docs/en/commands), [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works))

**Fidelity-A takeaway for koCode OpenSpec**

- Specify: single-column stream; user vs assistant separation; tools interleaved with text; interrupt leaves partial work; optional “verbose transcript” affordance.
- Do **not** require Claude’s exact transcript-viewer chrome or recap/PR-badge product surfaces unless a later grill pulls them in.

---

## 2. Tool call presentation

**Doc**

- Built-in tools are first-class named capabilities (not raw JSON dumps to the user). Categories: file ops, search, execution, web, code intelligence, plus orchestration tools. Exact names used in permissions/hooks include **`Read`**, **`Edit`**, **`Write`**, **`Bash`**, **`Grep`**, **`Glob`**, **`NotebookEdit`**, **`WebFetch`**, **`WebSearch`**, **`PowerShell`**, MCP tools, etc. ([Tools reference](https://code.claude.com/docs/en/tools-reference), [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works))
- **Collapsed vs expanded:**
  - Default stream keeps tool noise down; **MCP calls collapse** to a single line pattern like *“Called slack 3 times”*.
  - **`Ctrl+O` transcript viewer** expands detailed tool usage/execution. ([Interactive mode](https://code.claude.com/docs/en/interactive-mode))
- Background Bash can be moved with **`Ctrl+B`**; output is retrievable (e.g. via Read). ([Interactive mode](https://code.claude.com/docs/en/interactive-mode))
- Shell mode **`!`**: runs a command without Claude interpreting it; output enters conversation context (and as of recent versions may auto-trigger a response). Progress/output is shown in real time. ([Interactive mode](https://code.claude.com/docs/en/interactive-mode))

**Doc-UI / Inferred**

- Tools are presented as **human-readable actions** (name + key args/result summary), not as developer JSON blobs—consistent with permission dialogs that show command/path previews rather than raw tool envelopes. ([Permissions](https://code.claude.com/docs/en/permissions), [Permission modes](https://code.claude.com/docs/en/permission-modes))
- Success/error cues exist operationally (tests/commands fail/succeed; permission denials notify; auto-mode denials appear under `/permissions` “Recently denied”). Exact glyph language is **not** mandated in docs for the default stream. ([Permission modes](https://code.claude.com/docs/en/permission-modes))

**Common tools — presentation expectations under fidelity A**

| Tool family | Reference expectation | Confidence |
| --- | --- | --- |
| Read | Named read of a path; detail available in expanded/transcript view | Doc + Inferred |
| Edit / Write | File modification called out; may require permission; reviewable after the fact in acceptEdits | Doc |
| Bash / shell | Command shown for approval when required; output progress for `!` and long runs | Doc |
| Search (Grep/Glob) | Search as first-class tools; read-only inside workspace usually no prompt | Doc |
| MCP / unknown | Collapsed aggregate lines by default; expandable in transcript; permission/MCP rules apply | Doc |
| Unknown / custom | Still a named tool action with allow/deny path—not a raw JSON dump | Inferred |

**Fidelity-A takeaway**

- OpenSpec MUST: human-readable tool rows; specialized summaries for read/edit/write/shell/search; unknown-tool fallback; collapsed default with expandable detail.
- OpenSpec SHOULD NOT: require exact Claude glyphs (`●`/`✓`/`⎿`) or MCP “Called X N times” copy verbatim—those are clone-level.

---

## 3. Thinking presentation defaults

**Doc**

- **Extended thinking** is a session mode toggled with **`Option+T` / `Alt+T`** (`chat:thinkingToggle`). Has no effect on Fable 5 (always uses extended thinking). ([Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Keybindings](https://code.claude.com/docs/en/keybindings))
- Effort levels (`/effort`, model picker) control reasoning intensity separately from the UI toggle. ([Commands](https://code.claude.com/docs/en/commands))
- Status-line JSON exposes `thinking.enabled` and `effort.level` for custom chrome. ([Status line](https://code.claude.com/docs/en/statusline))

**Inferred**

- Docs do **not** fully specify default collapsed/expanded visual for thinking blocks in the main stream (unlike tool transcript collapse). Treat “thinking is optional/toggleable and should not dominate the stream” as the IA rule under fidelity A.
- When thinking content is shown, it should be **secondary** to assistant answer + tools (dimmed/collapsible is consistent with fidelity A, not mandated by docs).

**Fidelity-A takeaway**

- OpenSpec: thinking may appear as a distinct block; default should avoid flooding the timeline; user must be able to expand/inspect; exact emoji/header copy is non-goal.

---

## 4. Permission prompt structure and keyboard monopoly

**Doc / Doc-UI**

- Default posture: Claude **pauses and asks** before edits, many shell commands, network, etc., depending on **permission mode**. ([Permission modes](https://code.claude.com/docs/en/permission-modes), [Permissions](https://code.claude.com/docs/en/permissions))
- Tiered approval behavior ([Permissions](https://code.claude.com/docs/en/permissions)):

  | Tool type | Approval in default | “Yes, don’t ask again” |
  | --- | --- | --- |
  | Read-only (in workspace) | No | N/A |
  | Bash | Yes (except built-in read-only set) | **Permanent per repo + command** (settings.local) |
  | File modification | Yes | **Until session end** |

- Permission **modes** (CLI labels) ([Permission modes](https://code.claude.com/docs/en/permission-modes)):
  - `default` / **Manual** — ask for edits & commands
  - `acceptEdits` — auto file edits + common filesystem bash; status badge `accept edits on`
  - `plan` — explore/propose without editing source
  - `auto` — classifier-backed fewer prompts
  - `dontAsk`, `bypassPermissions` — restricted/CI or isolated environments
- **Cycle modes:** `Shift+Tab` (Windows fallback `Alt+M` in some runtimes). Status bar shows active mode badges. ([Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Permission modes](https://code.claude.com/docs/en/permission-modes))
- **Confirmation / permission keyboard context** ([Keybindings](https://code.claude.com/docs/en/keybindings)):
  - `confirm:yes` — **Y**, **Enter**
  - `confirm:no` — **N**, **Escape**
  - `confirm:previous` / `next` — **Up** / **Down**
  - `confirm:cycleMode` — **Shift+Tab**
  - `confirm:toggleExplanation` — **Ctrl+E** (Bash/PowerShell permission explanation)
  - Left/Right cycle dialog **tabs** where present ([Interactive mode](https://code.claude.com/docs/en/interactive-mode))
- **`Esc` semantics:** when a dialog (e.g. permission) is open, `Esc` **closes the dialog** rather than interrupting Claude (as of recent versions). ([Interactive mode](https://code.claude.com/docs/en/interactive-mode))
- Custom status line **hides during permission prompts** (and autocomplete/help). ([Status line](https://code.claude.com/docs/en/statusline))

**Inferred**

- IA is **three-way choice** in spirit: allow this time / allow broader (session or persistent rule) / deny—wording is “Yes” / “Yes, don’t ask again” / decline, with permanence differing by tool class.
- Focus monopoly is real: confirmation context owns navigation keys while open.

**Fidelity-A takeaway**

- OpenSpec MUST: blocking permission UI; allow-once / allow-broader / deny; keyboard select + confirm + escape; denial returns to agent as a handled rejection (not silent hang)—engine details stay in agent, UI must complete the loop.
- OpenSpec SHOULD NOT: require Claude’s exact option strings, tabbed dialog chrome, or full mode set (`plan`/`bypassPermissions`/classifier auto) unless koCode already has analogues.

---

## 5. Input gestures

**Doc** (defaults; many rebindable except reserved)

| Gesture | Claude Code default | Notes | Source |
| --- | --- | --- | --- |
| Submit | **Enter** (`chat:submit`) | | [Keybindings](https://code.claude.com/docs/en/keybindings) |
| Newline | **Shift+Enter** (many terminals), also **Ctrl+J**, `\+Enter`, Option+Enter (macOS meta) | Shift+Enter native in iTerm2/WezTerm/Ghostty/Kitty/Warp/Apple Terminal/Windows Terminal; some editors need `/terminal-setup` | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| Interrupt running turn | **Esc** (cancel response/tool mid-turn; keeps work so far); **Ctrl+C** as `app:interrupt` | Ctrl+C also clears empty/non-running input path toward exit | [Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Keybindings](https://code.claude.com/docs/en/keybindings) |
| Exit | **Ctrl+D** twice within 800ms; `/exit` | Reserved binding | [Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Quickstart](https://code.claude.com/docs/en/quickstart) |
| Redraw | **Ctrl+L** (`chat:clearInput` / redraw) | Preserves input & history; **not** primarily “wipe conversation”. Fullscreen: double Ctrl+L / Cmd+K can run `/clear` | [Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Keybindings](https://code.claude.com/docs/en/keybindings) |
| Clear conversation | **`/clear`** (aliases `/reset`, `/new`) | Explicit command | [Commands](https://code.claude.com/docs/en/commands) |
| File mention | **`@`** → file path autocomplete | Tab accept | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| Slash commands | **`/`** at start → command/skill menu | Filter by typing; Tab completion | [Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Commands](https://code.claude.com/docs/en/commands), [Quickstart](https://code.claude.com/docs/en/quickstart) |
| Shell prefix | **`!`** at start | Direct shell mode | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| History | **Up/Down**, **Ctrl+R** reverse search | Per-directory history; Ctrl+R UX differs slightly fullscreen vs default | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| External editor | **Ctrl+G** or **Ctrl+X Ctrl+E** | | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| Transcript detail | **Ctrl+O** | Verbose tools | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| Permission mode cycle | **Shift+Tab** | | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| Model picker | **Option+P / Alt+P** | | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| Stash prompt | **Ctrl+S** | | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| Double Esc | Clear draft (if text) or open **rewind** menu (if empty) | | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |
| Help on empty input | **`?`** | Shortcut help panel | [Interactive mode](https://code.claude.com/docs/en/interactive-mode) |

**Reserved / not rebindable:** Ctrl+C, Ctrl+D, Ctrl+M. ([Keybindings](https://code.claude.com/docs/en/keybindings))

**Fidelity-A takeaway**

- Core package gestures: Enter submit; newline without submit; interrupt in-flight work; slash menu; @ file mention; history search; mode cycle.
- Map Ctrl+L carefully: Claude’s default is **redraw**, conversation clear is **`/clear`**—OpenSpec should not blindly copy “Ctrl+L = clear chat” from third-party briefs without deciding.

---

## 6. Slash command discovery / selection

**Doc**

- Type **`/`** to see available commands/skills/plugins/MCP prompts; type more letters to **filter**. ([Commands](https://code.claude.com/docs/en/commands), [Interactive mode](https://code.claude.com/docs/en/interactive-mode), [Quickstart](https://code.claude.com/docs/en/quickstart))
- **Tab** completes command selection (quickstart “pro tips”). ([Quickstart](https://code.claude.com/docs/en/quickstart))
- Commands recognized at **start of message**; trailing text = args. Some commands run immediately even while Claude is responding (`/status`, `/tasks`, `/usage`). Others queue. ([Commands](https://code.claude.com/docs/en/commands))
- Representative built-ins relevant to alignment package: `/help`, `/clear`, `/compact`, `/model`, `/context`, `/cost`/`/usage` (via usage surfaces), `/permissions`, `/resume`, `/branch`, `/exit`, `/config`, … full list is large and plan/platform dependent. ([Commands](https://code.claude.com/docs/en/commands))
- Autocomplete context keys: Up/Down, Tab accept, Esc dismiss. ([Keybindings](https://code.claude.com/docs/en/keybindings))

**Fidelity-A takeaway**

- OpenSpec MUST: `/` discovery menu, incremental filter, keyboard move + accept, Esc dismiss, Enter execute/fill-args as appropriate.
- OpenSpec MUST NOT: require Claude’s full command catalog—only the alignment package set + koCode’s existing commands as verify-only.

---

## 7. Status bar / footer information architecture

**Doc-UI**

Claude Code separates:

1. **Custom status line** (optional script; row **above** built-in footer)  
2. **Built-in footer badges** (mode indicators, PR link badge, etc.)

([Status line](https://code.claude.com/docs/en/statusline), [Permission modes](https://code.claude.com/docs/en/permission-modes), [Interactive mode](https://code.claude.com/docs/en/interactive-mode) PR badge section)

### Custom status line data (what “dense chrome” can show)

Official stdin JSON includes (non-exhaustive): model id/display name; cwd / project dir; **context used/remaining %** and token fields; **cost USD**, durations, lines added/removed; **git/repo/worktree** fields; session id/name; rate limits; effort/thinking; PR number/state; vim mode; version. ([Status line](https://code.claude.com/docs/en/statusline))

Example IA from docs imagery/text:

- Model + directory + **context %**
- Multi-line: git info + color context bar + cost/duration

### Built-in footer examples

- Permission mode badges: e.g. `manual mode on`, `accept edits on`, `plan mode on`, `auto mode on`, … ([Permission modes](https://code.claude.com/docs/en/permission-modes))
- PR badge with review-state color when `gh` available. ([Interactive mode](https://code.claude.com/docs/en/interactive-mode))
- Startup chrome also shows version, model, working directory above the prompt ([Quickstart](https://code.claude.com/docs/en/quickstart))

### Narrow width / layout behavior

- Status scripts receive **`COLUMNS` / `LINES`** for sizing (not `tput`). ([Status line](https://code.claude.com/docs/en/statusline))
- Status line **temporarily hides** during autocomplete, help menu, permission prompts. ([Status line](https://code.claude.com/docs/en/statusline))
- Multi-line status supported; padding configurable. ([Status line](https://code.claude.com/docs/en/statusline))

**Fidelity-A takeaway**

- OpenSpec should specify a **persistent footer/status IA** with prioritized fields: model, permission/mode, running/task state, context pressure, cost (optional/secondary), cwd or project label, git branch if cheap.
- Narrow terminal: define **drop/collapse priority**, not pixel layout.
- Do **not** require Claude’s shell-script statusline engine or PR badge product.

---

## 8. Explicit non-goals for cloning

Under fidelity A, OpenSpec / implementation must **not** treat the following as acceptance criteria:

1. **Exact glyphs / symbols** (`●`, `✓`, `✻`, `⎿`, mode badge punctuation) or Claude marketing copy.
2. **Pixel spacing, spinners, animations**, sound, or desktop/web/IDE surface parity.
3. **Fullscreen renderer** behaviors, mouse hover lists, OSC-8 hyperlink chrome (optional later).
4. **Full keybinding engine** (`~/.claude/keybindings.json` contexts/actions matrix).
5. **Full permission mode matrix** (`plan`, `dontAsk`, `bypassPermissions`, classifier auto) if koCode’s modes remain `default` / `accept_edits` / `auto`.
6. **Custom statusline script host** (JSON-on-stdin shell)—only the *information architecture* of fields.
7. **Product extras** as MUST: voice dictation, `/btw` overlays, prompt suggestions, session recap, PR footer badge, ultrawork/ultraplan, remote-control, subagent team UI, vim mode completeness.
8. **brainless / shadcn** visual systems or Web component trees.
9. **Token-identical tool collapse strings** (“Called slack 3 times”)—pattern (aggregate MCP) may inspire SHOULD-level behavior only.
10. **Chasing Claude Code version deltas** as continuous compliance (docs are versioned heavily; lock IA, not weekly shortcuts).

---

## 9. Condensed IA checklist for downstream grills

Use this as the Claude-side of gap analysis against [`docs/wayfinder/tui-baseline-inventory.md`](./tui-baseline-inventory.md):

| Surface | Reference IA (fidelity A) |
| --- | --- |
| Timeline | Single column; user → assistant text/tools; interruptible; optional verbose tool transcript |
| Tools | Human summaries; expand detail; MCP/unknown not raw JSON |
| Thinking | Secondary, toggle/collapsible; don’t dominate |
| Permission | Blocking 3-way; keys owned; mode cycle discoverable |
| Input | Enter / newline / interrupt / `/` / `@` / history; clear-chat via command not redraw |
| Slash | Filterable menu + keyboard select |
| Status | Dense enough for model + mode + context (+ cost/git as priority allows); narrow drop policy |
| Seams | Prefer pull APIs for usage/context; cancel-turn is a first-class gesture in reference |

---

## 10. One-line reference verdict

**Claude Code’s terminal IA is a single-column agentic transcript with human-readable collapsible tools, a blocking three-way permission dialog under mode cycling, Enter/Shift+Enter/Esc/Ctrl+C input semantics, `/`+`@` discovery, and a footer/status region oriented around model, mode, context, and cost—not a glyph-level visual system to clone.**
