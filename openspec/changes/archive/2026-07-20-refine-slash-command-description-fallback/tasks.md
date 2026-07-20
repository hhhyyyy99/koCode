## 1. Command Filter Semantics

- [x] 1.1 Split slash command matching into command-name matches and description-only matches.
- [x] 1.2 Return only command-name matches when exact, prefix, or substring name matches exist.
- [x] 1.3 Return description matches only when no command names match the normalized query.
- [x] 1.4 Preserve existing name-match ranking and stable ordering inside each result phase.

## 2. Regression Tests

- [x] 2.1 Add a test proving `/context` returns `/context` without `/compact`.
- [x] 2.2 Add a test proving a command-name prefix such as `/con` suppresses description-only matches.
- [x] 2.3 Add a test proving description fallback still works for a term that matches no command names.
- [x] 2.4 Keep existing `/exit` ranking and empty-query order tests passing.

## 3. Verification

- [x] 3.1 Run `pnpm --filter @kocode/ko-tui test`.
- [x] 3.2 Run `pnpm --filter @kocode/ko-tui typecheck`.
- [x] 3.3 Run `openspec validate --all --strict`.
- [x] 3.4 Run `pnpm bundle` if TUI source changes affect the packaged CLI.
