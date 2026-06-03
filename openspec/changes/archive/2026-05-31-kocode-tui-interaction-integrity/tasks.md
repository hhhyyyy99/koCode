## 1. Baseline Audit

- [x] 1.1 Run the current TUI through a real `pnpm dev` session and record the observed failures for running input, slash focus, permission focus, tool expansion, and next-input recovery
- [x] 1.2 Confirm whether `packages/ko-cli/bin/kocode.mjs`, `pnpm dev`, and workspace package exports run the same TUI implementation or document the mismatch
- [x] 1.3 Add focused regression notes for the known issues: input replaced by `● Thinking...`, `ctrl+o` hint not wired, `focused={false}` tool cards, and Escape shortcut conflicts

## 2. Focus Routing Model

- [x] 2.1 Define a `FocusMode` type in the TUI layer covering input, slash, status modal, model modal, permission, tool output, and history search
- [x] 2.2 Move global keyboard decisions in `App.tsx` behind focus-mode checks so inactive modes ignore unrelated keys
- [x] 2.3 Update `InputBox`, `CommandPanel`, `PermissionDialog`, and modal components to request focus changes through callbacks instead of assuming ownership
- [x] 2.4 Add unit tests for focus transitions: input to slash, slash to input, input to modal, modal close to input, permission blocking Escape rewind

## 3. Input Continuity

- [x] 3.1 Keep `InputBox` mounted while `running=true`; replace the disabled `● Thinking...` branch with a running indicator that does not remove the editable draft
- [x] 3.2 Define and implement Enter behavior while busy: queue the prompt or reject submission with a visible non-destructive message
- [x] 3.3 Preserve draft text across running state changes, permission dialogs, modal open/close, and command panel open/close
- [x] 3.4 Add tests for draft preservation and busy-submit behavior

## 4. Tool Output Navigation

- [x] 4.1 Add selected tool tracking for the current/last turn and render a visible focus marker when tool-output mode is active
- [x] 4.2 Wire the documented expand/collapse key; prefer `Ctrl+O` if retaining the current `ctrl+o to expand` hint
- [x] 4.3 Ensure collapsed long output shows a stable summary plus remaining-lines hint, and expanded output can collapse back to summary
- [x] 4.4 Add tests for tool focus movement, expand/collapse, hint consistency, and long-output truncation

## 5. Permission Modal Flow

- [x] 5.1 Make pending permission requests switch focus mode to permission and store the previous focus mode for restoration
- [x] 5.2 Ensure PermissionDialog owns Up, Down, Enter, Escape, and numeric decision keys while active
- [x] 5.3 Prevent slash navigation, history search, busy submit, and Esc Esc rewind from firing while permission focus is active
- [x] 5.4 Restore input focus and preserved draft after approve, approve-all, deny, or Escape cancel
- [x] 5.5 Add tests for approve, deny, Escape cancel, keyboard ownership, and focus restoration

## 6. Real TTY Acceptance

- [x] 6.1 Create or document a repeatable real TTY golden path covering input, running state, tool rendering, permission resolution, tool expansion, completion marker, and next input
- [x] 6.2 Run the full live golden path with `pnpm dev` and record the exact command/session notes in `validation.md`
- [x] 6.3 Verify the same path against the intended CLI/bundle entrypoint if the distributed CLI is expected to be used
- [x] 6.4 Run `pnpm test` and `pnpm typecheck` after implementation
- [x] 6.5 Update `kocode-tui-full-alignment` tasks to depend on this interaction-integrity acceptance before marking further visual parity items complete
