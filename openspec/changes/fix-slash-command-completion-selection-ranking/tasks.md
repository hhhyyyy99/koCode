## 1. Command Filtering

- [x] 1.1 Add deterministic query normalization for slash command filtering, including leading slash, case, and trailing whitespace handling.
- [x] 1.2 Replace registration-order-only filtering with relevance-ranked results: exact name, name prefix, name contains, then description contains.
- [x] 1.3 Preserve default registry order for an empty slash query and within equal relevance tiers.

## 2. Tab Completion Selection

- [x] 2.1 Update slash-mode Tab handling so it completes `filteredCommands[slashIndex]` instead of the first filtered command.
- [x] 2.2 Ensure selected argument commands complete with one trailing space and place the cursor after that space.
- [x] 2.3 Ensure Tab is a no-op when there are no filtered commands.

## 3. Regression Tests

- [x] 3.1 Add tests proving `/exit` ranks before `/quit` while `/quit` can still appear as a description match.
- [x] 3.2 Add tests proving empty slash query order remains stable.
- [x] 3.3 Add a regression test proving Tab completes the highlighted non-first command.
- [x] 3.4 Add or update tests for Tab completion of selected argument commands.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @kocode/ko-tui test`.
- [x] 4.2 Run `pnpm --filter @kocode/ko-tui typecheck`.
- [x] 4.3 Run `openspec validate --all --strict`.
- [x] 4.4 Run `pnpm bundle` if TUI source changes affect the packaged CLI.
