## Context

The previous slash command ranking change made command-name matches outrank description-only matches, but it still allows both result types to appear together. That preserves discovery, but it makes exact command input noisy: `/context` still shows `/compact` because `/compact` describes "conversation context".

The command filter already has enough information to distinguish name matches from description matches. This change refines result inclusion, not command metadata, UI layout, or keyboard routing.

## Goals / Non-Goals

**Goals:**

- Prefer command-name search whenever at least one command name matches the query.
- Hide description-only matches while command-name matches are available.
- Keep description fallback for discovery queries that do not match any command name.
- Preserve existing ordering within name-match tiers and description fallback results.

**Non-Goals:**

- Do not remove description search entirely.
- Do not add aliases or new command metadata fields.
- Do not change Tab or Enter selection behavior.
- Do not redesign the command panel presentation.

## Decisions

### Use two-phase filtering

The filter should first evaluate command-name matches. If one or more commands match by exact name, prefix, or name substring, return only those command-name matches. If no command names match, then return description matches.

Alternative considered: keep current rank-only behavior. That keeps related commands visible, but exact command input such as `/context` feels imprecise because unrelated actions remain in the completion list.

### Keep description fallback for discovery

Description matching remains useful for semantic discovery, such as `token` finding `/context`. The fallback rule keeps that behavior while avoiding noise during command-name entry.

Alternative considered: require command names only. That would make slash completion predictable but remove discoverability that existing specs and tests expect.

### Preserve existing ranking inside each phase

Name matches should keep the existing relevance order: exact name, prefix, then substring. Description fallback results should preserve registry order or any existing stable relevance order within the description tier.

Alternative considered: add a more advanced fuzzy scorer. That is unnecessary for this bug and would make behavior harder to explain.

## Risks / Trade-offs

- [Risk] Users may expect related commands to remain visible after typing a valid prefix. -> The panel becomes more precise during command entry; discovery remains available when no command names match.
- [Risk] Multiple active command-panel changes can overlap before archiving. -> Keep this change narrowly scoped to fallback inclusion so it layers cleanly on top of the ranking change.
- [Risk] Tests may only cover exact names. -> Include both exact and prefix scenarios, plus a no-name-match fallback scenario.
