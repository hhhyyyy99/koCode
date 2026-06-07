## Context

The current TUI uses Ink + React and renders the prompt row in `InputBox.tsx` with `ink-text-input`. `App.tsx` owns the input text as a string, slash mode state, command selection, modal focus, and submission routing. `ink-text-input` owns an internal cursor offset that only clamps when the existing cursor becomes longer than the new value.

That split is the root of the command completion cursor bug. When the user types `/`, the third-party input cursor is at offset 1. When slash completion changes the external value to `/help` or `/model `, the third-party cursor remains at offset 1 because it is still in range. The next typed character is inserted after `/`, corrupting the completed command.

The same hidden-state problem applies to history restore, external editor return, multiline insertion, and future `@` path completion. The TUI has moved from a simple text field to an editor-like input surface, so the cursor needs to be part of the application-controlled input state.

## Goals / Non-Goals

**Goals:**

- Represent the input as an explicit buffer: text plus cursor offset.
- Make all user edits and programmatic edits go through shared input-buffer operations.
- Render the input cursor from controlled state instead of relying on `ink-text-input` cursor state.
- Preserve existing input layout, prompt, placeholder, slash command panel, history search, prefix routing, and running draft behavior.
- Fix slash completion so continued typing appends at the intended location.
- Establish a reusable foundation for future `@` file/path completion.

**Non-Goals:**

- Do not add `@` file autocomplete in this change.
- Do not redesign the command panel visual layout.
- Do not change command handlers, model/session behavior, or prefix routing semantics beyond cursor placement.
- Do not add a new terminal UI framework or broad editor dependency.

## Decisions

### Use an explicit `InputBuffer`

The TUI should replace the single `message: string` state with a buffer shape owned by `App.tsx` or a nearby input hook:

```ts
interface InputBuffer {
  text: string;
  cursorOffset: number;
}
```

All submit and routing paths should read `input.text`. All edit paths should update both fields.

Rationale: cursor position is now observable behavior. It affects where the next typed character lands after command completion, history restore, external editor return, and multiline insertion.

Alternative considered: keep `message: string` and remount `ink-text-input` with a key after completion. That fixes the slash Tab symptom but preserves hidden cursor state and repeats the same issue for history, editor return, and future path completion.

### Add input-buffer operations instead of ad hoc string mutations

The implementation should centralize text editing in small pure helpers such as:

```ts
setInputText(text, cursor = text.length)
insertText(buffer, text)
deleteBackward(buffer)
deleteForward(buffer)
moveCursor(buffer, direction)
replaceRange(buffer, start, end, text, cursor)
```

These helpers should clamp cursor offsets and keep edit behavior testable without mounting Ink.

Rationale: today edits are spread across `InputBox` callbacks, `App` slash handlers, history search, and external editor callbacks. Centralizing the operations reduces hidden drift between text and cursor state.

Alternative considered: keep edit behavior inside the React component. That makes cursor behavior harder to unit test and forces component tests for simple buffer mutations.

### Render a local controlled input component

`InputBox` should render a small local input renderer instead of `ink-text-input`. The renderer receives text, cursor offset, placeholder, focus, and edit callbacks. It should display the cursor by inverting the character at the cursor offset, or a trailing space when the cursor is at the end.

Rationale: `ink-text-input` does not expose a cursor offset prop or a "move cursor to end after external value update" API. A local controlled renderer gives deterministic behavior without introducing a broad dependency.

Alternative considered: fork `ink-text-input`. A local component is likely smaller than maintaining a package fork and can match this TUI's multiline and shortcut behavior directly.

### Keep focus and business routing in `App`

`App.tsx` should continue to own focus modes, slash mode, modal state, command execution, and submission routing. The input buffer should be the only new state shape crossing the `App` / `InputBox` boundary.

Rationale: the existing focus router is already the integration point for slash panels, modals, permission dialogs, tool focus, and global shortcuts. This change should not mix command business behavior into the input renderer.

### Treat programmatic edits as first-class operations

Slash completion, command selection, history restore, and editor return must explicitly choose a cursor placement:

- Completed slash command without args: cursor at end before submit or execution.
- Filled slash command with args: cursor after the trailing argument space.
- Restored history entry: cursor at the end of restored text.
- External editor return: cursor at the end of returned text.
- Multiline insert: cursor after the inserted newline.

Rationale: this is the behavioral contract that prevents the current bug and keeps future completion features coherent.

## Risks / Trade-offs

- [Risk] Reimplementing text input can regress basic editing shortcuts. → Keep the first implementation intentionally small and cover plain insertion, deletion, left/right movement, Enter, Alt+Enter, Ctrl+J, Escape, and focus gating with focused tests.
- [Risk] JavaScript string offsets can split emoji or combining characters. → Prefer cursor movement over Unicode code points or grapheme clusters for display/edit helpers where practical; at minimum, preserve existing behavior for ASCII, CJK, and command prefixes before broadening Unicode handling.
- [Risk] Ink rendering of multiline controlled cursor can be visually inconsistent. → Test multiline insertion and render behavior separately; keep layout unchanged around the prompt and separators.
- [Risk] App and InputBox both currently listen to keyboard input. → During migration, make one layer responsible for each key family: text-edit keys in the controlled input, slash navigation/global focus keys in `App`.
- [Risk] Removals of `ink-text-input` can expose differences in paste behavior. → Add a paste-like multi-character insertion test and ensure inserted text lands at the cursor with the cursor after the inserted text.
