## Why

The live TTY validation for `kocode-tui-interaction-integrity` exposed a trust-breaking bug: a harmless `ls(.)` tool call opened a `Create file` permission dialog. This happens because the agent currently treats every non-`bash`, non-`edit` permission request as `write`, so read/list/search tools are mislabeled as file creation.

## What Changes

- Introduce an explicit tool permission taxonomy instead of deriving permission behavior from a two-branch fallback.
- Classify tools by effect:
  - read-only: `ls`, `read`, `grep`, `find`
  - file mutation: `write`, `edit`
  - command execution: `bash`
- Ensure read-only tools do not show `Create file` dialogs. In default mode they should execute without confirmation unless a future policy explicitly marks them sensitive.
- Ensure permission dialogs use the actual tool category and never fallback unknown tools to `Create file`.
- Add regression coverage for the live case: asking to analyze the current project may call `ls(.)`, and that must not request file creation permission.
- Feed the result back into `kocode-tui-interaction-integrity` task 6.2 so the full live golden path can proceed after this bug is fixed.

## Capabilities

### New Capabilities
- `tool-permission-taxonomy`: Defines read-only, file-mutation, command-execution, and unknown tool permission behavior.
- `permission-dialog-semantics`: Defines how permission request categories map to user-facing dialog titles, descriptions, and allow-all wording.

### Modified Capabilities

## Impact

- Affected packages: `packages/ko-agent` for permission classification and event payloads; `packages/ko-tui` for permission dialog rendering semantics.
- Likely affected files: `packages/ko-agent/src/agent-session.ts`, `packages/ko-agent/src/events.ts`, `packages/ko-agent/src/tools/index.ts`, `packages/ko-agent/src/ko-agent.test.ts`, `packages/ko-tui/src/PermissionDialog.tsx`, and focused TUI tests.
- No new dependencies are expected.
- This may expand the `permission_request.toolType` union or replace it with a richer category. Any type change must update both agent and TUI together.
