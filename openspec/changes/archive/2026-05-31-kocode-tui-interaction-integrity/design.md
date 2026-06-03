## Context

koCode currently uses Ink 5 and React 18 for the TUI, with a turn-based conversation model and components such as `App`, `InputBox`, `CommandPanel`, `ToolCallCard`, `PermissionDialog`, and `StatusBar`. The previous TUI alignment work added many Claude Code-inspired features, but several user-facing interactions are still implicit or inconsistent: running turns replace the input box, global shortcuts compete with modal shortcuts, tool cards advertise expansion keys that are not actually wired, and permission prompts do not establish a clear modal boundary.

This change treats the TUI as an interactive state machine. The goal is not to add more features, but to make the existing core loop reliable under real terminal use.

## Goals / Non-Goals

**Goals:**
- Preserve user input and visible control while the agent is running.
- Centralize keyboard routing through an explicit focus mode.
- Make tool output expansion and focus behavior deterministic and visible.
- Make permission prompts modal gates with predictable keyboard ownership and state restoration.
- Add a repeatable real TTY acceptance path for the core interaction loop.

**Non-Goals:**
- Do not redesign the full visual language or complete Claude Code parity.
- Do not add MCP management, theme polish, full session branching, or advanced model selection UI.
- Do not replace Ink/React or rewrite the turn rendering architecture.
- Do not change provider APIs or tool execution semantics unless a minimal event contract adjustment is required.

## Decisions

### D1: Model focus explicitly in `App`

Use a single focus mode owned by `App`, with values such as `input`, `slash`, `status-modal`, `model-modal`, `permission`, and `tool-output`. Keyboard handlers must check this mode before acting. Child components can request focus changes through callbacks, but global routing remains centralized.

**Rationale**: Today multiple `useInput` handlers can observe the same key and independently act. A single focus mode makes conflicts visible and testable.

**Alternative considered**: Let each component keep local keyboard ownership. Rejected because it is exactly how slash mode, permission prompts, search, and global shortcuts drift into conflicts.

### D2: Keep input mounted during running turns

`InputBox` remains visible while the agent is running. The status bar and prompt affordance indicate running state, but the input field does not disappear and the draft is not cleared except on explicit submit.

**Rationale**: A coding agent TUI should let the user prepare the next instruction while work is in progress. Replacing input with `● Thinking...` breaks continuity and makes the UI feel unavailable.

**Alternative considered**: Disable input while running. Rejected for this change because it preserves the current interruption rather than solving it. If concurrent prompt submission is not supported, Enter can queue or be blocked with a clear message while editing remains possible.

### D3: Treat tool expansion as navigable output state

Tool cards expose a focused index, visible focus marker, and a single documented expand/collapse key. The displayed hint must match the actual key. `Ctrl+O` is preferred because existing UI text already references it; if implementation chooses Enter instead, the UI copy must change everywhere.

**Rationale**: Tool transparency only works if users can reliably inspect details. Hidden focus or mismatched hints are worse than no hint.

**Alternative considered**: Expand all tool output by default. Rejected because long command output destroys scanability and terminal scrollback density.

### D4: Permission prompts are blocking modals

When a permission request is pending, focus mode becomes `permission`. The dialog owns arrow, Enter, Escape, and number shortcuts. Other handlers must ignore those keys until the permission is resolved. After resolution, focus returns to the prior mode, usually `input`.

**Rationale**: Permission is a security and trust boundary. It must be impossible for slash navigation, history search, or global escape handling to accidentally consume the same key event.

**Alternative considered**: Render permissions inline while leaving normal input active. Rejected because it makes approval/denial ambiguous and increases the chance of accidental actions.

### D5: Real TTY acceptance is required

Add or document a repeatable manual/automated real TTY validation path that exercises the complete loop: input, running turn, tool call, permission request, tool expansion, completion marker, and next input. Unit tests remain useful, but they are not sufficient for acceptance of keyboard and focus behavior.

**Rationale**: Ink interactions can pass component tests while failing in an actual terminal due to focus, raw mode, key encoding, terminal width, or render timing.

**Alternative considered**: Rely on unit and snapshot tests. Rejected because the current problem is specifically interactive drift that static checks missed.

## Risks / Trade-offs

- **[Risk] Focus centralization touches several components** -> Keep the API small: focus mode, selected tool index, and callbacks; avoid broad component rewrites.
- **[Risk] Running input could imply concurrent agent turns** -> Preserve editing but define submit behavior explicitly: queue, reject with message, or wait until idle.
- **[Risk] Permission modal may block useful global keys** -> Allow only intentional escape/cancel behavior while permission is active; all other shortcuts resume after resolution.
- **[Risk] Real TTY acceptance can be slow or flaky** -> Keep one short golden path and a small checklist rather than attempting full end-to-end coverage for every feature.
- **[Risk] Existing full-alignment tasks overlap** -> This change is the prerequisite interaction layer; later visual parity tasks should depend on it rather than duplicate it.

## Migration Plan

1. Introduce focus mode and routing without changing visual layout.
2. Keep input mounted during running turns and define submit behavior while busy.
3. Wire tool output focus and expansion with matching visible hints.
4. Convert permission prompts to strict modal ownership and restore prior focus after resolution.
5. Add focused unit tests for routing and state transitions.
6. Run the real TTY acceptance loop and record the result in tasks before considering the change ready.

## Open Questions

- Should pressing Enter while a turn is running queue the next prompt, reject with a clear notification, or wait until idle?
- Should `Ctrl+O` expand the focused tool only, all tools in the current turn, or open a temporary full-output view?
- Should history search (`Ctrl+R`) be available while a turn is running, or only while idle?
