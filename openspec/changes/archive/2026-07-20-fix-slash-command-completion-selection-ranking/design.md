## Context

The slash command panel keeps three related pieces of state in `App.tsx`: the filtered command list, the selected command index, and the input buffer. Rendering already uses the selected index, but Tab completion currently reads the first filtered command. Command filtering also uses a simple name-or-description substring check that preserves command registration order, so a description-only synonym can outrank an exact command-name match.

The existing `tui-command-panel` capability covers slash panel filtering, keyboard navigation, and Tab completion cursor placement. This change tightens those semantics without changing the command registry shape or adding a new matching dependency.

## Goals / Non-Goals

**Goals:**

- Make Tab completion complete the highlighted slash command.
- Rank command-name matches ahead of description-only matches.
- Keep useful description matches such as `/quit` for "exit" without allowing them to outrank exact command names.
- Keep cursor placement deterministic after completion.
- Add focused tests for the selection and ranking regressions.

**Non-Goals:**

- Do not redesign the slash command panel UI.
- Do not change command handlers or command registration metadata.
- Do not add an external fuzzy-search dependency.
- Do not introduce aliases as a separate command model field in this change.

## Decisions

### Use the selected index for Tab completion

Tab completion should read the same command that the panel renders as selected. The implementation should select `filteredCommands[slashIndex]` rather than `filteredCommands[0]`, using the existing navigation state as the single source of truth.

Alternative considered: reset selection to the first result before completing. That would make Tab deterministic but contradict the highlighted row and the existing arrow-navigation contract.

### Score filter results by match relevance

Filtering should continue to return commands whose names or descriptions match the query, but results should be sorted by relevance before display. Recommended ordering:

1. Empty query: preserve registry order.
2. Exact command-name match, accepting either `/exit` or `exit` query forms.
3. Command name starts with the query.
4. Command name contains the query.
5. Description contains the query.

Within the same tier, preserve registry order. This keeps command ordering stable while ensuring `/exit` ranks before `/quit` when the user typed `/exit`, because `/exit` is a command-name match and `/quit` is only a description match.

Alternative considered: remove description matching. That would avoid the `/quit` ranking issue, but it would make discovery worse for queries such as "token" matching `/context`.

### Normalize slash query text before scoring

The query should be lowercased, trimmed, and compared against both the full command name and the command name without the leading slash. Trailing whitespace inserted by argument-command completion should not produce an empty or misleading result set.

Alternative considered: compare only the raw query from the input buffer. That preserves current behavior but leaves `/exit` and `exit` with slightly different semantics and makes trailing spaces brittle.

## Risks / Trade-offs

- [Risk] Reordering results can surprise users who rely on registry order for description-only matches. -> Preserve registry order for empty queries and within equal relevance tiers.
- [Risk] A relevance scorer can grow into a complicated fuzzy matcher. -> Keep the first implementation as deterministic substring tiers with no new dependency.
- [Risk] Helper-level tests may miss App-level selection wiring. -> Add at least one regression around the selection-to-completion helper or App key path, plus ranking tests for `filterCommands`.
