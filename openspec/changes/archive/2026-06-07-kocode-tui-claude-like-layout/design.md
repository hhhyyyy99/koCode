## Context

The current TUI is already event-driven and componentized, with `Header`, `Welcome`, `InputBox`, `StatusBar`, and `CommandPanel` handling the affected surface. The requested reference is Claude Code's terminal layout: compact identity at the top, full-width separator lines around the prompt, and a slash-command list that behaves like completion output rather than a modal card. The user explicitly said the small icon/logo should be ignored.

## Goals / Non-Goals

**Goals:**

- Make the first viewport visually match the referenced Claude-like terminal hierarchy.
- Keep existing input routing, command filtering, keyboard navigation, status bar, and focus behavior intact.
- Render separators based on terminal width instead of a hard-coded 60-character line.
- Present slash commands as an aligned unbordered list below the input area.
- Ensure slash commands are visually adjacent to the input frame; the status bar must not sit between the prompt separator and completion list.
- Remove logo artwork as a normative requirement for this layout.

**Non-Goals:**

- Do not implement new commands.
- Do not change agent runtime behavior, provider behavior, permissions, or session persistence.
- Do not copy Claude Code icon artwork.
- Do not introduce a new TUI framework or runtime dependency.

## Decisions

### D1: Treat This as Layout Refinement, Not Feature Expansion

The change should preserve current state machines and handlers. `App.tsx` should continue to own focus, slash mode, modal state, and submission routing; child components should only change presentation and formatting.

Alternative considered: introduce a new top-level layout component that rewrites the screen structure. This is unnecessary because the existing render order already maps to the desired layout.

### D2: Terminal-Width Separators

The separator should be derived from the active terminal width, with a conservative fallback for tests and non-TTY rendering. This avoids the current narrow line on wide terminals and makes the input frame read like the reference.

Alternative considered: keep `60` fixed for test stability. This fails the visual goal and makes the layout look detached on normal terminal widths.

### D3: Unbordered Slash Completion List

`CommandPanel` should remove `borderStyle="round"` and render rows in aligned text columns. The selected row keeps the `❯` marker; unselected rows reserve the same marker width so descriptions align.

Alternative considered: keep the rounded panel and only adjust padding. The reference layout is explicitly a list below a separator, so the border is the main visual mismatch.

### D4: Optional Source Metadata on Command Rows

The command model may expose an optional source/scope label later, but this change can render source metadata only when available and avoid changing command execution semantics. Project-level OpenSpec commands can eventually render `(project)` on a continuation line matching the reference.

Alternative considered: hard-code `(project)` for selected commands. That would misrepresent built-in commands and mix layout work with command registry semantics.

### D5: Header Owns Startup Identity

The compact header should carry version, model/context, and cwd on startup. The empty conversation body should not duplicate that same information and should not render logo artwork or getting-started tips in this layout mode.

Alternative considered: keep a separate logo-free welcome body with tips. This preserves the old welcome-screen capability but pushes the layout away from the provided reference, which shows identity at the top and the input/command area as the first interactive focus.

### D6: Slash Panel Before Status Bar

When slash mode is active, the command panel should render immediately after the input separator. The status bar may remain persistent below the panel, but it must not interrupt the visual relationship between the typed `/` and its completion list.

Alternative considered: keep the persistent status bar directly below input in all modes. This preserves a stable footer but breaks the Claude-like completion-list placement and the new command-panel spec.

## Risks / Trade-offs

- **[Risk] Dynamic width makes snapshots brittle** -> Use an injectable/default width in helper functions and component tests.
- **[Risk] Removing the command panel border reduces visual separation** -> Keep the full-width separator immediately above the panel and preserve selected-row highlighting.
- **[Risk] Existing specs still require logo/bordered input** -> This change modifies those requirements explicitly so implementation does not fight archived expectations.
- **[Risk] Existing welcome-screen spec still requires logo and tips** -> Include `tui-welcome-screen` in this change and explicitly move startup identity to the header for this layout mode.
- **[Risk] Persistent status bar can separate input from slash completions** -> Render command completions before the status bar while slash mode is active.
- **[Risk] Long command descriptions can wrap poorly** -> Define a stable command-name column and indent wrapped/metadata lines to the description column.
