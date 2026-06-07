## Why

Slash command filtering still shows description-only matches beside exact command-name matches, so typing `/context` displays `/compact` because its description contains "context". This makes command completion feel noisy once the user has already typed a valid command name or prefix.

## What Changes

- Treat command-name matches as the primary slash command search mode.
- Use description matching only as a fallback when no command names match the current query.
- Keep description-based discovery for terms like `token` that do not match a command name.
- Add regression coverage for `/context` excluding `/compact` while preserving description fallback behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tui-command-panel`: Refine command filter behavior so description-only matches are shown only when there are no command-name matches.

## Impact

- Affected code: `packages/ko-tui/src/commands.ts` and focused command-filter tests.
- Affected specs: `openspec/specs/tui-command-panel/spec.md`.
- Dependencies/APIs: No new dependencies and no public API changes expected.
