## ADDED Requirements

### Requirement: Progressive alignment on existing Turn model

The TUI SHALL implement Claude Code–style information architecture by evolving the existing Turn / `AssistantItem` / `useTurns` / focus-mode model. The TUI MUST NOT introduce a parallel TimelineEvent (or equivalent) source of truth for the same conversation surface.

#### Scenario: Single timeline source of truth

- **WHEN** assistant content streams during a turn
- **THEN** the TUI renders that content through the existing Turn / ordered assistant items path
- **AND** no second independent timeline model is required for the same events

#### Scenario: Focus modes remain the keyboard router

- **WHEN** permission, slash, history-search, transcript-block, or modal surfaces are active
- **THEN** keyboard routing continues through the existing focus-mode system rather than ad-hoc global handlers that bypass it

### Requirement: Fidelity A acceptance boundary

Progressive alignment SHALL be accepted on **information architecture and key gestures**, not on pixel, glyph, or exact English chrome-string cloning of Claude Code.

#### Scenario: Structure and behavior are in scope

- **WHEN** an acceptance scenario for this package is evaluated
- **THEN** it asserts visible fields, action semantics, focus ownership, default collapse, key contracts, or model-feedback paths

#### Scenario: Glyph and string clone are out of scope

- **WHEN** a UI surface differs from Claude Code in symbol characters, border drawing, or exact label wording
- **AND** the surface still satisfies the locked IA and gesture contract
- **THEN** the difference is not a package failure

### Requirement: Package non-goals

This package MUST NOT require any of the following as product deliverables:

- Claude custom statusline script host or PR footer badge
- Project-level or per-command permission allow-lists
- Claude full permission mode matrix (`plan`, `bypassPermissions`, classifier-auto)
- Interactive `@` file picker / path autocomplete UI
- Ctrl+L as clear-chat or redraw product requirement
- Session-level thinking master toggle as baseline
- Agent loop, permission engine core, or session-store rewrites
- New agent event types for status, tools, thinking, cancel, or compaction presentation
- Pixel/symbol cloning of Claude Code chrome

#### Scenario: Deferred surfaces are not package blockers

- **WHEN** `@` picker, Ctrl+L clear-chat, or session thinking toggle are absent
- **THEN** the progressive-alignment package may still be considered complete if all MUST IA and gesture requirements pass
