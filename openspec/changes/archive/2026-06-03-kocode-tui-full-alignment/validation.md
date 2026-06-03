# Validation Notes

## Phase 0 Interaction Integrity

Phase 0 is satisfied by the archived `kocode-tui-interaction-integrity` change plus the follow-up permission taxonomy/tool-event dedup fixes. Evidence:

- Archived validation: `openspec/changes/archive/2026-05-31-kocode-tui-interaction-integrity/validation.md`.
- Live command: `pnpm dev` from `/home/hjy/桌面/project/koCode`.
- Live prompt: `分析一下当前项目`.
- Observed after fixes: input remained available while the agent was running, read-only tools did not open mutation permission dialogs, tool cards rendered as stable single cards, and a later `bash(pwd)` opened exactly one `Bash command` modal.
- Runtime entrypoint audit confirmed `pnpm dev`, source package exports, and bundle/CLI entrypoint use the same TUI source implementation.
- Verification after fixes passed: `pnpm --filter @kocode/ko-agent test`, `pnpm --filter @kocode/ko-agent typecheck`, `pnpm --filter @kocode/ko-tui test`, `pnpm --filter @kocode/ko-tui typecheck`, `pnpm test`, and `pnpm typecheck`.

Tier-specific live acceptance tasks remain separate and should only be checked after their own `pnpm dev` paths are exercised.

## Unit Coverage Added

- Added `packages/ko-tui/src/input-prefix.ts` and `prefixParsing.test.ts` to cover `!`, `#`, `/`, `@`, empty, and plain prompt routing used by `App.handleSubmit`.
- Expanded `PermissionDialog.test.ts` to cover bash/write/edit dialog titles, allow-all wording, and preview line semantics.
- Verification: `pnpm --filter @kocode/ko-tui test` passed with 50 tests; `pnpm --filter @kocode/ko-tui typecheck` passed.

## Live TTY Validation - 2026-06-01

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode`.

Completed live checks:

- Welcome/Header initial render: startup showed koCode version, model `mimo/mimo-v2.5-pro · 200k context`, cwd, ASCII logo, welcome text, tips, input prompt, and `◉ Default` status bar.
- Command panel: typing `/` opened the panel with `/help`, `/clear`, `/compact`, `/resume`, `/branch`, `/quit`, and `↓ 17 more below`, proving 20+ commands are present.
- Header conversation mode: after `!pwd`, header changed to compact `koCode v0.1.0 · mimo/mimo-v2.5-pro · 200k context` plus cwd.
- Shift+Tab permission mode cycle: status bar changed `◉ Default` -> `◉ Accept Edits` -> `◉ Auto` -> `◉ Default`.
- Shell prefix/tool card: `!pwd` rendered a local turn with `✓ bash(pwd)`, `⎿ /home/hjy/桌面/project/koCode`, and `✻ Cooked for 0s`; no duplicate Done notification remained.
- Memory prefix: `#full-alignment validation note` saved to `.claude/CLAUDE.local.md`; the test note was removed afterward and the file is empty again.
- /context: exact slash command submission executed `/context` instead of the highlighted `/compact`; output showed tree lines for System prompt, Built-in commands, CLAUDE.md, Conversation history, Plugin/Skill context, Total, and green health.
- /status: exact slash command submission opened a three-tab modal. Default tab was Settings; right arrow switched to Status, right arrow switched to Usage, and Esc closed back to input. Status tab included version, session name/id, cwd, model, API base URL, context window, permission, and running state. Usage tab reused the /cost report.
- /model: no-arg `/model` opened the modal hint; `/model mimo/mimo-v2.5-pro` displayed `Switched to mimo/mimo-v2.5-pro`. A regression where current custom/config model IDs failed lookup was fixed.
- /cost: exact slash command submission displayed Total cost, API duration, wall duration, code changes, and Usage by model. This verifies the report format with zero usage; the multi-turn nonzero usage acceptance remains separate.

Fixes made during validation:

- Slash command submission now prefers an exact typed command over the currently highlighted filtered command, fixing `/context` accidentally running `/compact`.
- Slash-panel selection of `/status` opens the same modal route as direct submission.
- `shell_start`/`shell_end` events now render as a local Bash tool turn instead of disappearing into notifications.
- Bash tool cards now summarize stdout with the `⎿` result line.
- `StatusPanel` now has Settings / Status / Usage tabs, defaults to Settings, and reuses the /cost usage report.
- `/context` and `/cost` output formats were expanded to match their specs.
- `/model <current provider/id>` succeeds for the currently active custom/config model.

Verification commands after fixes:

- `pnpm --filter @kocode/ko-agent test`: passed, 29 tests.
- `pnpm --filter @kocode/ko-agent typecheck`: passed.
- `pnpm --filter @kocode/ko-tui test`: passed, 56 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.
- `pnpm test`: passed, 106 tests across 16 files.
- `pnpm typecheck`: passed.

## Live TTY Validation - 2026-06-02

Command: `EDITOR=true pnpm dev` from `/home/hjy/桌面/project/koCode`.

Completed live checks:

- `/theme light` submitted in the real TTY switched the running ThemeProvider immediately; the header primary color changed from white to black and the status bar right-side mode indicator also re-rendered with the light theme primary color.
- `/theme` after the switch reported `Available themes: dark, light, ansi. Current: light`, proving the command reads the live ThemeContext state rather than a static default.
- `!printf beta-history` rendered as a local Bash tool turn with `✓ bash(printf beta-history)`, `⎿ beta-history`, and `✻ Cooked for 0s`.
- Ctrl+R entered reverse history search and `beta` matched `!printf beta-history`; pressing Enter restored the command to input. A first combined text+CR write did not select until a second Enter, so task 16.7 remains open pending a cleaner fix/validation.
- Ctrl+G with `EDITOR=true` returned the existing draft to the input after editor exit, but a transient literal `g` was observed before restoration. Task 20.6 remains open pending a cleaner fix/validation.

Fixes made during validation:

- `/theme <name>` now uses the TUI command context to call ThemeContext `setTheme` at runtime instead of reporting that restart is required.
- Header, StatusBar, InputBox, CommandPanel, Markdown, ToolCallCard, Turn, UserBubble, and StatusPanel now read core colors from ThemeContext for primary/secondary/dimmed/success/warning/error rendering.
- Ctrl+R/Ctrl+G now mark their shortcut echo for suppression in `InputBox.handleChange`; follow-up live validation is still required before checking the history/editor acceptance tasks.

Verification commands after fixes:

- `pnpm --filter @kocode/ko-tui typecheck`: passed.
- `pnpm --filter @kocode/ko-tui test`: passed, 61 tests.

## Live TTY Validation - 2026-06-02 Ctrl+R/Ctrl+G Follow-up

Commands:

- `EDITOR=true pnpm dev` from `/home/hjy/桌面/project/koCode`.
- `EDITOR=/tmp/kocode-editor-test.sh pnpm dev`, where the temporary editor wrote `edited-from-ctrl-g` into the editor file.

Completed live checks:

- Submitted `!printf beta-history`; the local Bash turn rendered `✓ bash(printf beta-history)`, `⎿ beta-history`, and `✻ Cooked for 0s`, populating input history without provider/API dependency.
- Pressed Ctrl+R, searched `beta`, and pressed Enter once; the input restored to `!printf beta-history`.
- Pressed Ctrl+G with `EDITOR=true`; no literal `g` remained in the draft after editor return, and the existing input content was preserved.
- Pressed Ctrl+G with `EDITOR=/tmp/kocode-editor-test.sh`; after the editor process wrote the temp file, the input box showed `edited-from-ctrl-g`, proving saved editor content is read back into the draft.

Fixes made during validation:

- Search mode now handles printable search text and return in the same input event, selecting the matching history entry immediately.
- Ctrl+R/Ctrl+G detection now recognizes embedded control characters and `InputBox.handleChange` strips `\x12`/`\x07` control characters so batched PTY input cannot pollute drafts.

Verification commands after fixes:

- `pnpm --filter @kocode/ko-tui typecheck`: passed.
- `pnpm --filter @kocode/ko-tui test`: passed, 61 tests.


## Live TTY Validation - 2026-06-02 Session Branching

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode`.

Completed live checks:

- `/branch validation-branch` created a persisted branch and reported `Created branch validation-branch (<id>)`.
- `/branch` opened an interactive Branches modal. After fixing duplicate branch rows, the modal showed current `main` marked with `*` plus `tty-branch`, with no React key warning.
- `/resume` opened an interactive Resume Session modal with recent sessions showing session name/id, last access time, model, and turn count.
- Pressing Enter in the Resume Session modal selected a session, closed the modal, and displayed `Resumed tty-branch`.

Fixes made during validation:

- Session store now supports session summaries, branch metadata, branch snapshots, and existing-session path lookup.
- AgentSession now supports `createBranch()`, `listBranches()`, `resumeSession()`, and emits `session_resumed`.
- TUI now has `SessionPanel` plus `/branch` and `/resume` modal routes.
- Branch list de-duplicates current `main` entries to avoid duplicate React keys.

Verification commands after fixes:

- `pnpm --filter @kocode/ko-agent test`: passed, 31 tests.
- `pnpm --filter @kocode/ko-agent typecheck`: passed.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.
- `pnpm --filter @kocode/ko-tui test`: passed, 61 tests.

Note: Full session-resume acceptance remains open until a live TTY selection of a non-empty previous session visibly restores conversation history.


## Live TTY Validation - 2026-06-02 Session Resume Acceptance

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode`.

Setup:

- Created a named persisted session `resume-visible` using project session-store APIs.
- The session contains one user message `resume-visible-user-message` and one assistant text message `resume-visible-assistant-message`.

Completed live checks:

- `/resume` opened the interactive Resume Session modal.
- The modal listed `resume-visible` with model `test-provider/test-model` and `turns 1`.
- Down arrow selected `resume-visible`; Enter resumed it and closed the modal.
- The TUI rendered compact conversation mode with the restored user message `resume-visible-user-message`, assistant text `resume-visible-assistant-message`, completion marker, and an active input prompt for continuing the conversation.

Verification commands after acceptance:

- `pnpm --filter @kocode/ko-agent test`: passed, 31 tests.
- `pnpm --filter @kocode/ko-agent typecheck`: passed.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.
- `pnpm --filter @kocode/ko-tui test`: passed, 61 tests.

## Live TTY Validation - 2026-06-02 Welcome, Command Panel, Header Follow-up

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode` in a real PTY.

Completed live checks:

- Startup welcome mode rendered `koCode v0.1.0`, model `mimo/mimo-v2.5-pro · 200k context`, cwd `/home/hjy/桌面/project/koCode`, ASCII logo, `Welcome to koCode!`, getting-started tips for `/help`, `/model`, `/clear`, plus active input and `◉ Default` status bar.
- Typing `/` opened the command panel below the input. The panel showed `/help`, `/clear`, `/compact`, `/resume`, `/branch`, `/quit`, and `↓ 17 more below`, proving a 23-command set in the live UI.
- Down arrow moved the selected command from `/help` to `/clear`; Escape closed the command panel and restored the empty input prompt.
- Tab in slash mode completed the first filtered command (`/help`) rather than moving selection. This is acceptable for the current spec because `tui-command-panel` requires Up/Down, Enter, and Escape navigation, not Tab navigation.

Additional repeatable checks added after the live run:

- `formatWelcomeLines` test verifies logo, model/context, cwd, and required `/help`, `/model`, `/clear` tips.
- `formatHeaderLines` tests verify welcome-mode three-line header and compact conversation-mode two-line header.
- Command tests now verify the 20+ command set includes the required commands and that command filtering works by name/description.

Verification commands after checks:

- `pnpm --filter @kocode/ko-tui test`: passed, 66 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.

Note: The automated PTY harness wrote Enter/Return sequences as literal newlines in `ink-text-input` during this run, so this record does not claim fresh live submit evidence for `/clear` execution or local `!pwd` turn creation. Prior 2026-06-01 validation already observed compact header after `!pwd`; today's added `formatHeaderLines` test preserves that expected header contract.

## Live TTY Validation - 2026-06-02 Theme Selector Acceptance

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode` in a real PTY.

Completed live checks:

- Typed `/theme` and pressed Enter; the TUI opened an interactive Theme modal instead of only printing a static list.
- The modal rendered all required options: Auto (match terminal), Dark mode, Light mode, Dark mode (colorblind-friendly), Light mode (colorblind-friendly), Dark mode (ANSI colors only), and Light mode (ANSI colors only).
- The current `Dark mode` option was marked with `✔` and the selected row used `❯`.
- The modal displayed a preview code snippet plus running/error color samples.
- Pressing Down moved selection to `Light mode`; the preview syntax color changed from cyan to blue, proving preview follows selection.
- Pressing Enter applied Light mode immediately. The Header primary color changed to black, the status bar mode indicator changed to black, and the TUI displayed `Theme switched to light`.
- Config persistence was verified after exit: `/home/hjy/.kocode/config.yaml` contains `ui.theme: light`.

Fixes made during validation:

- Added `ThemePanel` with keyboard navigation, current-theme marker, and preview snippet.
- Expanded built-in theme catalogue to include auto, dark/light, colorblind variants, and ANSI dark/light while preserving the legacy `ansi` alias for `/theme ansi`.
- `/theme` without arguments now opens the selector; `/theme <name>` still switches directly.
- CLI startup reads `ui.theme` from config and theme changes persist through `onThemeChange`.

Verification commands after fixes:

- `pnpm --filter @kocode/ko-tui test`: passed, 69 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.
- `pnpm --filter @kocode/ko-cli typecheck`: passed.

## Live TTY Validation - 2026-06-02 AI Turn, Running Status, Syntax Highlight

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode` in a real PTY.

Fix made before the live run:

- `InputBox` now treats bare Enter/Return as submit and keeps Alt+Enter / Ctrl+J as explicit newline shortcuts. This fixed the prior PTY behavior where submitted text was inserted as a literal newline. Added `inputKeyAction` tests for submit vs newline behavior.

Completed live checks:

- Submitted `!printf enter-ok` by typing the command and pressing Enter separately. The local shell turn rendered `✓ bash(printf enter-ok)`, `⎿ enter-ok`, and `✻ Cooked for 0s`, confirming Enter submission and the `!` prefix path in a real TTY.
- Submitted a no-prefix AI prompt: `请只回复一个很短的 Python 代码块，定义 add(a, b) 并返回和。`
- During the AI request, the input prompt changed to `●`, placeholder changed to `Agent running; draft next message...`, and status bar right side changed to `● Running...`.
- The AI response streamed thinking text and then a Python code block. Syntax highlighting was visible: `def` and `return` rendered in the keyword color while code punctuation/plain text used dimmed/default colors.
- The completed AI turn showed `✻ Baked for 5s`, proving the live turn completion marker and duration display.
- After completion, input returned to idle `❯` and status bar returned to `◉ Default`.
- `/cost` after the turn showed live usage format with API duration `5s`, wall duration, code changes, and model row `mimo/mimo-v2.5-pro: input 0, output 76...`. Because input usage remained `0` and total cost stayed `$0.0000`, `/cost` nonzero/full usage acceptance remains open pending usage accounting verification.

Difference observed and left open:

- During the AI stream, the TUI briefly displayed `Error: Agent is already running` even though the same turn continued streaming and completed successfully. This appears to be an erroneous provider/agent error event and should be fixed before final live acceptance.
- The shell turn still displayed a transient duplicate running `bash(printf enter-ok)` card before settling to a single completed card. This does not block the local prefix evidence, but it remains a visual stability issue for final comparison.

Verification commands after the Enter fix:

- `pnpm --filter @kocode/ko-tui test`: passed, 71 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.

## Live TTY Validation - 2026-06-02 Submit Dedup Follow-up

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode` in a real PTY.

Fix made before the live run:

- Removed the manual `wrappedSubmit()` call from `InputBox.useInput` for bare Enter. Bare Enter is still classified as submit intent, but actual submission is left to `ink-text-input`'s `onSubmit`, preventing duplicate submit paths.

Completed live checks:

- Typed `!printf dedup-ok`, pressed Enter, and observed a single local shell turn with `✓ bash(printf dedup-ok)`, `⎿ dedup-ok`, and `✻ Cooked for 0s`. The previous transient duplicate running Bash card did not recur.
- Typed `请只回复：ok`, pressed Enter, and observed one AI turn. Running prompt/status appeared during the request, the model replied `ok`, and the turn completed with `✻ Cooked for 3s`.
- The previous erroneous `Error: Agent is already running` message did not recur during this live AI turn.
- Input and status bar returned to idle after completion.

Verification commands after the fix:

- `pnpm --filter @kocode/ko-tui test`: passed, 71 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.


## Live TTY Validation - 2026-06-02 /cost Nonzero Usage Follow-up

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode` in a real PTY.

Fix made before the live run:

- AgentSession now normalizes provider usage before accumulation: missing reported input tokens are filled from the current request context estimate, total tokens are derived when absent, and model pricing is applied with `calculateCost` when provider cost is zero.
- Added `packages/ko-agent/src/agent-session-usage.test.ts` covering the prior failure shape where provider usage reported output tokens but input/cost stayed zero.

Completed live checks:

- Submitted `请只回复：ok`; the TUI entered running state, the model replied `ok`, and the turn completed with `✻ Cooked for 3s`.
- Ran `/cost` after the first AI turn. The report showed `Total cost: $0.0047`, `Total API duration: 3s`, code changes `+0 / -0`, and model row `mimo/mimo-v2.5-pro: input 1414, output 28, cache read 0, cache write 0, cost $0.0047`.
- Submitted a second prompt `请只回复：done`; the model replied `done` and completed with `✻ Cooked for 2s`.
- Ran `/cost` again after multiple turns. The report showed accumulated nonzero usage and cost: `Total cost: $0.0095`, `Total API duration: 6s`, `Total wall duration: 1m 51s`, and model row `mimo/mimo-v2.5-pro: input 2886, output 56, cache read 0, cache write 0, cost $0.0095`.

Verification commands after the fix:

- `pnpm --filter @kocode/ko-agent test`: passed, 32 tests.
- `pnpm --filter @kocode/ko-agent typecheck`: passed.

## Live TTY Validation - 2026-06-02 Prefix Routing Acceptance

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode` in a real PTY.

Fix made before the live run:

- `@` input now has an explicit `file_reference` route instead of being indistinguishable from a plain prompt. The routed prompt sent to the agent includes `Referenced file: <path>` plus the remaining user message.
- Updated `prefixParsing.test.ts` to assert the explicit `file_reference` route.

Completed live checks:

- Submitted `!ls`; the TUI rendered a local Bash tool turn with `✓ bash(ls)`, `⎿` output lines including repository entries, a truncation hint `… +3 lines (ctrl+o to expand)`, and `✻ Cooked for 0s`. No AI running turn was started for the shell prefix.
- Submitted `#Use tabs`; the TUI displayed `Saved to /home/hjy/桌面/project/koCode/.claude/CLAUDE.local.md`. The validation line was then removed and the file was restored to empty.
- Submitted `@./src 请只回复：file-ref-ok`; the rendered user message became `Referenced file: ./src` followed by `请只回复：file-ref-ok`, proving the path reference is included in the AI-visible user message. The model acknowledged the referenced `./src` path in thinking, attempted a read-only `ls(./src)` tool call, and replied `file-ref-ok`, with completion marker `✻ Baked for 8s`.
- No-prefix AI behavior was revalidated in the earlier same-day /cost run with prompts `请只回复：ok` and `请只回复：done`, both of which ran as normal AI turns and completed successfully.

Verification commands after the fix:

- `pnpm --filter @kocode/ko-tui test`: passed, 71 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.


## Live TTY Validation - 2026-06-02 Permission and Rewind Follow-up

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode` in real PTY sessions.

Fixes made during validation:

- `InputBox` now treats trailing CR/LF delivered through `ink-text-input` `onChange` as submit input and passes the submitted text to `App.handleSubmit`, fixing the real PTY path where Enter was inserted into the draft instead of submitting.
- Added `/rewind` command handler and command coverage for checkpoint restore via command path.
- Attempted Esc Esc stabilization through input/TTY handling; real PTY validation still did not trigger rewind from Esc Esc, so Esc Esc acceptance remains open.

Completed live checks:

- Submitted `!printf enter-fixed`; the local turn rendered exactly one `✓ bash(printf enter-fixed)`, `⎿ enter-fixed`, and `✻ Cooked for 0s`, proving Enter submission works again in the real PTY.
- In Default mode, asked the model to call Bash with `printf permission-bash-ok`. The TUI displayed a `Bash command` permission dialog with command preview, options `1. Yes`, `2. Yes, and always allow printf in this project`, `3. No`; pressing `1` executed the tool and rendered `✓ bash(printf permission-bash-ok)` with `⎿ permission-bash-ok`.
- In Default mode, asked the model to edit `./tmp-kocode-permission-live.txt` from `beta` to `gamma`. The TUI displayed an `Edit file` permission dialog with the path, preview line `1 gamma`, and the three expected file-change options; pressing `1` executed the edit.
- In Accept Edits mode, asked the model to edit the same file from `beta` to `gamma`. No edit permission dialog appeared and the tool rendered `✓ edit(./tmp-kocode-permission-live.txt)`, proving edit auto-approval in Accept Edits.
- After an edit checkpoint, running `/rewind` displayed `Rewound: restored /home/hjy/桌面/project/koCode/./tmp-kocode-permission-live.txt`; `nl -ba tmp-kocode-permission-live.txt` then showed `1 beta`, proving checkpoint restore works through the command path.

Open differences / not accepted yet:

- Pressing Esc Esc in the real PTY did not trigger rewind after multiple attempts; the file remained `gamma`. Task 18.6 and checkpoint acceptance remain unchecked.
- The checkpoint spec asks for a rewind confirmation dialog; current implementation directly restores on command path and does not yet present confirmation.

Verification commands after fixes:

- `pnpm --filter @kocode/ko-tui test`: passed, 72 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.

## Live TTY Validation - 2026-06-02 Esc Esc Checkpoint Rewind Acceptance

Command: `pnpm dev` from `/home/hjy/桌面/project/koCode` in real PTY sessions.

Fixes made during validation:

- `InputBox` now reports bare Esc from both `ink-text-input` value echoes and direct `key.escape` events, while stripping ESC bytes/sequences from the draft.
- Removed duplicate input-focus Esc handling from `App` so one Esc is not counted twice.
- Added `RewindDialog`; Esc Esc opens `Rewind checkpoint` with `Rewind to before the last change?` and options `1. Yes` / `2. No`.
- `InputBox.handleChange` now ignores `ink-text-input` echoes while the input is not focused, preventing modal choices from leaking into the draft.

Completed live checks:

- Verified single Esc does not rewind, and two Esc presses outside the 500ms window do not rewind.
- Verified Shift+Tab switches to `◉ Accept Edits` without being interpreted as Esc Esc.
- Reset `tmp-kocode-permission-live.txt` to `beta`, then in Accept Edits mode asked the model to use `edit` to change `beta` to `gamma`. The TUI rendered `✓ edit(./tmp-kocode-permission-live.txt)` and the file content was confirmed as `gamma` with `xxd -g 1`.
- Pressed Esc Esc; the `Rewind checkpoint` confirmation dialog appeared with the required question and Yes/No options.
- Pressed Enter on the default Yes option; the TUI displayed `Rewound: restored /home/hjy/桌面/project/koCode/./tmp-kocode-permission-live.txt`.
- Confirmed `xxd -g 1 tmp-kocode-permission-live.txt` showed `62 65 74 61` (`beta`) after rewind.

Verification commands after fixes:

- `pnpm --filter @kocode/ko-tui test`: passed, 76 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.

## Live TTY Validation - 2026-06-02 Claude Code Tool Card Cross-Check

Commands:

- `claude` from `/home/hjy/桌面/project/koCode`, Claude Code v2.1.144.
- `pnpm dev` from `/home/hjy/桌面/project/koCode` in a real PTY.

Claude Code evidence observed:

- Prompted Claude Code to create `./tmp-claude-card-compare.txt` with Write and content `alpha` / `beta`.
- Claude Code displayed `● Write(tmp-claude-card-compare.txt)`.
- Its permission preview showed `Create file`, the filename, `╌` separators, numbered content lines `1 alpha` and `2 beta`, and the question `Do you want to create tmp-claude-card-compare.txt?`.
- After approving with `1`, Claude Code displayed `⎿ Wrote 2 lines to tmp-claude-card-compare.txt` with numbered written content below.

koCode fixes made from the cross-check:

- Tool display names are now Claude-style title case in cards: `Write(...)`, `Read(...)`, `Bash(...)`, etc., while internal tool names remain unchanged.
- Write summaries now render `⎿ Wrote N lines to <path>` from the tool input content, matching Claude Code's result line.
- Expanded Write output uses the written content with line numbers rather than the internal `File written: ...` result string.
- Write permission dialog now uses `╌` separators, `Do you want to create <file>?`, and `Yes, allow all edits during this session` wording.
- Separator width was reduced to avoid wrapping inside the Ink border in a real TTY.

koCode post-fix live evidence:

- Prompted koCode to create `./tmp-kocode-card-compare-2.txt` with Write and content `alpha` / `beta`.
- The running tool rendered `● Write(./tmp-kocode-card-compare-2.txt)`.
- The permission preview showed `Create file`, the target path, `╌` separators, numbered content lines, and `Do you want to create tmp-kocode-card-compare-2.txt?`.
- After approving with `1`, the completed card rendered `✓ Write(./tmp-kocode-card-compare-2.txt)` and `⎿ Wrote 2 lines to tmp-kocode-card-compare-2.txt`.

Remaining known difference:

- Claude Code strips the leading `./` from the Write title parameter, while koCode currently preserves the exact relative path in the title. The result summary strips `./` and matches Claude's wording. This is recorded as a minor visual difference for the final sweep rather than blocking the tool-card acceptance because symbols, title casing, permission preview shape, line numbering, separators, and result wording now match the observed Claude Code behavior.

Verification commands after fixes:

- `pnpm --filter @kocode/ko-tui test`: passed, 77 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.


## Final Live TTY Validation - 2026-06-03 Full Alignment Sweep

Commands:

- `pnpm dev` from `/home/hjy/桌面/project/koCode` in real PTY sessions.
- `claude` from `/home/hjy/桌面/project/koCode` was used earlier for the same tool-card flow; observed Claude Code version was v2.1.144.
- Verification commands after final fixes: `pnpm test` and `pnpm typecheck`.

Completed final live checks:

- Startup rendered the welcome screen, active input prompt, and `◉ Default` status bar.
- Typing `/` opened the command panel with `/help`, `/clear`, `/compact`, `/resume`, `/branch`, `/quit`, and `↓ 18 more below`, proving the 20+ command set remains available.
- `!printf final-ok` rendered a single local Bash turn with `✓ Bash(printf final-ok)`, `⎿ final-ok`, and `✻ Cooked for 0s`; no duplicate running card appeared.
- A real model-triggered Write flow for `./tmp-kocode-final-write-4.txt` displayed `● Write(tmp-kocode-final-write-4.txt)` with the leading `./` stripped from the title, matching the Claude Code cross-check.
- The Write permission dialog displayed `Create file`, the target path, 60-character `╌` separators that did not wrap, exactly two preview lines (`1 alpha`, `2 beta`), and `Do you want to create tmp-kocode-final-write-4.txt?`.
- Approving with `1` completed the tool as `✓ Write(tmp-kocode-final-write-4.txt)` with `⎿ Wrote 2 lines to tmp-kocode-final-write-4.txt`.
- The model turn naturally completed with `✻ Baked for 14s`, returned to idle input, and did not trigger a second Write or fallback Bash permission request after the agent history fix.
- Esc Esc rewind was validated earlier in the same change: the confirmation dialog appeared and restored `tmp-kocode-permission-live.txt` from `gamma` to `beta`.

Differences found during the final sweep and fixed:

- Trailing newline in Write/Read content was being counted as an extra blank display line. `ToolCallCard` and `PermissionDialog` now share display-line semantics that ignore one trailing newline; regression coverage was added.
- Error tool cards for denied Write/Bash actions could show tool-specific success summaries. `ToolCallCard.toolSummary()` now prioritizes error content, rendering `Error: Permission denied by user` for denied tools.
- Agent history omitted assistant `toolCall` content when processing `toolcall_end`; the next provider loop saw a `tool_result` without its paired assistant `tool_use`, causing the live model to retry with another write path. AgentSession now records the assistant tool call in message history and reuses same-signature tool results across loop iterations without re-emitting permission prompts.
- Denied permissions are now persisted as `toolResult` messages so the model receives a clear error result instead of an incomplete tool exchange.

Verification commands after final fixes:

- `pnpm --filter @kocode/ko-agent test`: passed, 34 tests.
- `pnpm --filter @kocode/ko-agent typecheck`: passed.
- `pnpm --filter @kocode/ko-tui test`: passed, 79 tests.
- `pnpm --filter @kocode/ko-tui typecheck`: passed.
- `pnpm test`: passed, 134 tests across 22 files.
- `pnpm typecheck`: passed.

Final status:

- The earlier Claude Code comparison difference about preserving `./` in Write titles is resolved; koCode now strips the leading `./` in Write titles and summaries.
- Final task 21.2 is satisfied by the repeated real `pnpm dev` sweep above.
- Final task 21.3 is satisfied by the recorded Claude Code v2.1.144 cross-check.
- Final task 21.4 is satisfied by the recorded differences and fixes above.
