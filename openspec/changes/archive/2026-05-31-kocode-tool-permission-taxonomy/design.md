## Context

The current agent permission logic is too coarse. `checkToolPermission()` returns a boolean, and when permission is needed the agent derives `toolType` with `bash -> bash`, `edit -> edit`, and everything else -> `write`. That fallback makes read-only tools such as `ls`, `read`, `grep`, and `find` appear as `Create file` in the TUI.

This breaks the trust model: users cannot tell whether the agent is listing files or about to mutate the project. It also blocks the remaining live golden path in `kocode-tui-interaction-integrity` because the first harmless project-analysis action can show a dangerous-looking permission prompt.

## Goals / Non-Goals

**Goals:**
- Define a single taxonomy for tool effects and permission behavior.
- Allow read-only tools (`ls`, `read`, `grep`, `find`) without file-creation prompts in default mode.
- Keep mutation tools (`write`, `edit`) and execution tools (`bash`) permission-gated in default mode.
- Make permission request payloads explicit enough for TUI rendering without fallbacking unknown tools to `Create file`.
- Add regression tests for `ls(.)` and other read-only tools.

**Non-Goals:**
- Do not redesign the full permission policy UI.
- Do not add persistent allow/deny rules beyond the existing session behavior.
- Do not change tool execution semantics except permission classification.
- Do not make bash safe-by-default; command execution remains gated in default mode.

## Decisions

### D1: Replace boolean permission with tool category decision

Introduce a helper that classifies a tool into categories such as `read`, `write`, `edit`, `bash`, and `unknown`. Permission decisions should be based on this category instead of raw tool name fallback logic.

**Rationale**: The current boolean loses information before the TUI sees it. A category preserves enough semantic context for both policy and rendering.

**Alternative considered**: Keep boolean permission and patch the TUI title for `ls`. Rejected because it treats one symptom while leaving `read`, `grep`, `find`, and unknown tools ambiguous.

### D2: Read-only tools are allowed in default mode

Default permission mode should allow `ls`, `read`, `grep`, and `find` without confirmation. These tools inspect the workspace but do not mutate files or execute arbitrary shell commands.

**Rationale**: Project analysis requires frequent read/list/search calls. Prompting for every read creates noise, and mislabeling reads as writes destroys trust.

**Alternative considered**: Ask for read permissions with a `Read directory` dialog. Deferred. This can be added later as a stricter workspace trust mode, but default project analysis should not show file creation prompts.

### D3: Unknown tools fail closed with explicit semantics

Unknown tool names should not be silently rendered as `Create file`. They should either be denied before permission or classified as `unknown` with a neutral dialog label such as `Tool permission`.

**Rationale**: Fallbacking unknown to write is misleading. Security posture should remain conservative without lying in the UI.

**Alternative considered**: Treat unknown as write for safety. Rejected because the UI text becomes factually wrong.

### D4: PermissionDialog renders from category, not fallback title

The TUI should map permission categories to user-facing labels. `write` means `Create file`, `edit` means `Edit file`, `bash` means `Bash command`, and `unknown` means a neutral permission prompt. Read-only categories normally should not reach the dialog in default mode.

**Rationale**: The dialog is the trust boundary. Its title and allow-all copy must describe the requested action accurately.

## Risks / Trade-offs

- **[Risk] Read-only tools can reveal sensitive workspace content** -> This matches current coding-agent expectations after workspace trust. Future stricter modes can introduce read confirmations without using `Create file` wording.
- **[Risk] Type changes affect agent and TUI together** -> Update the event union and all switch/mapping code in one change with typecheck coverage.
- **[Risk] Existing tests may assume all tools prompt in default mode** -> Update tests to assert the intended taxonomy instead of the old blanket behavior.
- **[Risk] Unknown tools policy can block extension tools** -> Make unknown behavior explicit and testable; future plugin/MCP work can register categories.

## Migration Plan

1. Add a taxonomy helper in the agent layer and unit tests for every built-in tool.
2. Update permission request generation to use category-specific toolType values.
3. Skip permission prompts for read-only built-in tools in default and accept-edits modes.
4. Update `PermissionDialog` title/options mapping to avoid `Create file` fallback for unknown categories.
5. Add regression tests for `ls(.)` project analysis behavior.
6. Re-run the live TTY golden path from `kocode-tui-interaction-integrity`.

## Open Questions

- Should `read` of files outside cwd ever be allowed if path sandboxing changes in the future?
- Should future MCP/plugin tools declare their category in `ToolDefinition` instead of relying on name-based classification?
