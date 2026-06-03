## 1. Agent Permission Taxonomy

- [x] 1.1 Add a typed tool category helper for built-in tools: read-only (`ls`, `read`, `grep`, `find`), file creation (`write`), file edit (`edit`), command execution (`bash`), and unknown
- [x] 1.2 Replace the current `bash/edit/else write` permission request classification in `AgentSession` with the taxonomy helper
- [x] 1.3 Update `checkToolPermission` or equivalent logic so read-only built-ins do not request permission in default mode
- [x] 1.4 Keep `write`, `edit`, and `bash` permission-gated in default mode and preserve existing `auto` / `accept_edits` behavior where appropriate
- [x] 1.5 Define explicit behavior for unknown tools so they do not masquerade as `write` / `Create file`

## 2. Event Contract and TUI Semantics

- [x] 2.1 Update `AgentSessionEvent` permission request typing to carry the new permission category or expanded `toolType` union
- [x] 2.2 Update `PermissionDialog` title mapping so unknown/generic categories render neutral wording instead of `Create file`
- [x] 2.3 Update allow-all option wording to match bash, file mutation, and unknown categories accurately
- [x] 2.4 Ensure read-only tool calls normally never reach `PermissionDialog` in default mode

## 3. Regression Tests

- [x] 3.1 Add agent-level tests proving `ls`, `read`, `grep`, and `find` do not emit `permission_request` as `write` in default mode
- [x] 3.2 Add agent-level tests proving `write`, `edit`, and `bash` still emit correctly classified permission requests in default mode
- [x] 3.3 Add tests for unknown tool classification or generic permission semantics
- [x] 3.4 Add TUI tests for permission dialog titles/options for write, edit, bash, and unknown/generic categories

## 4. Live Golden Path Integration

- [x] 4.1 Update `kocode-tui-interaction-integrity/validation.md` with the discovered `ls(.) -> Create file` defect and link this change as the fix plan
- [x] 4.2 After implementation, rerun the project-analysis live path and verify `ls(.)` does not show `Create file`
- [x] 4.3 If the live path passes, return to `kocode-tui-interaction-integrity` and complete task 6.2

## 5. Verification

- [x] 5.1 Run `pnpm --filter @kocode/ko-agent test`
- [x] 5.2 Run `pnpm --filter @kocode/ko-tui test`
- [x] 5.3 Run `pnpm test`
- [x] 5.4 Run `pnpm typecheck`
