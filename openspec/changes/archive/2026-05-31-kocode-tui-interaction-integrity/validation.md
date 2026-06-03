# Validation Notes

## Baseline Audit

Observed from source before implementation:
- `InputBox` returned only `● Thinking...` while disabled/running, removing the editable input surface.
- `App` routed keyboard input through separate `slashMode`, `modal`, and permission state branches instead of one focus mode.
- `ToolCallCard` advertised `ctrl+o to expand`, but expansion was local to the card and only toggled via focused Enter; `Turn` always passed `focused={false}`.
- `App` used a browser-style `window` value for Esc Esc tracking, which is unsafe in the Node/Ink runtime.
- Permission dialogs had their own `useInput` handler while global handlers could still observe the same key events.

## Runtime Entrypoints

- `pnpm dev` runs `tsx packages/ko-cli/src/index.ts` from the root package script.
- `packages/ko-cli/src/index.ts` imports `@kocode/ko-tui` for interactive mode.
- `packages/ko-tui/package.json` exports `./src/index.ts`.
- `scripts/bundle.mjs` bundles `packages/ko-cli/src/index.ts` and aliases `@kocode/ko-tui` to `packages/ko-tui/src/index.ts`.

Conclusion: source dev mode and bundled CLI are intended to use the same TUI source implementation after bundling.

## Real TTY Golden Path

Manual path to run after configuring a working provider/API key:
1. Run `pnpm dev` in a real terminal.
2. Type a normal prompt that triggers at least one tool call.
3. While the agent is running, type a draft next prompt and verify the input remains visible.
4. Trigger a permission-requiring write/edit/bash action and verify the dialog owns arrows, number keys, Enter, and Escape.
5. Press `Ctrl+O` to enter tool-output focus, then press `Ctrl+O` again to expand/collapse the focused tool. Use Up/Down or Tab to move focus between tool cards.
6. Wait for the turn completion marker, then submit the preserved next prompt.

Current automated validation:
- `pnpm --filter @kocode/ko-tui test`
- `pnpm --filter @kocode/ko-tui typecheck`
- `pnpm test`
- `pnpm typecheck`

TTY smoke test performed:
- Command: `pnpm dev` in a PTY from `/home/hjy/桌面/project/koCode`.
- Result: TUI rendered welcome screen, current model/cwd, input prompt, and status bar successfully. Session exited with Ctrl+C.

A full live golden path with model-generated tool calls and permission prompts still requires a configured working provider/API key plus manual interaction.

## Live Golden Path Defect

A project-analysis live run exposed a permission taxonomy bug before the full golden path could be completed:
- Prompt: analyze the current project.
- Observed tool call: `ls(.)`.
- Incorrect result: TUI opened a `Create file` permission dialog.
- Root cause: agent permission classification treated any non-`bash`, non-`edit` permission request as `write`.
- Fix plan: `kocode-tool-permission-taxonomy`.


## Tool Permission Taxonomy Follow-up

`kocode-tool-permission-taxonomy` live check result:
- Command: `pnpm dev`, prompt `分析一下当前项目`.
- Observed after fix: `ls(.)` completed directly and did not open `Create file`.
- Observed expected permission gate: subsequent `bash(pwd)` opened `Bash command`.
- New separate defect observed: duplicate React keys for tool cards and duplicated running tool cards (`ls(.)` / `bash(pwd)`) during live streaming. This prevents considering the full `kocode-tui-interaction-integrity` golden path complete yet.

## Final Live Golden Path

Final live validation after permission taxonomy and tool-event dedup fixes:
- Command: `pnpm dev` from `/home/hjy/桌面/project/koCode`.
- Prompt: `分析一下当前项目`.
- Observed: `ls(.)`, `read(package.json)`, `ls(packages)`, and package reads rendered as single stable tool cards rather than duplicated cards.
- Observed: read-only tools did not open `Create file` or any mutation permission dialog.
- Observed: a later `bash(pwd)` action opened exactly one `Bash command` permission dialog, confirming permission focus/modal flow on a live provider path.
- Verification run after fixes: `pnpm --filter @kocode/ko-agent test`, `pnpm --filter @kocode/ko-agent typecheck`, `pnpm --filter @kocode/ko-tui test`, `pnpm --filter @kocode/ko-tui typecheck`, `pnpm test`, and `pnpm typecheck` all passed.
