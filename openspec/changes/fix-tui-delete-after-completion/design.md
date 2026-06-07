## Context

`kocode-tui-controlled-input-buffer` replaced `ink-text-input` with a local controlled input buffer. That made cursor placement deterministic, but it also changed delete-key behavior. Ink parses `\x7f`, which many terminals emit for Backspace, as `key.delete`. The old `ink-text-input` handled both `key.backspace` and `key.delete` as backward deletion. The new code maps `key.delete` to forward deletion.

When the cursor is at the end of text, forward deletion is a no-op. This is why completed commands such as `/help|` and ordinary typed input such as `abc|` cannot be erased in terminals that report Backspace as `key.delete`.

## Goals / Non-Goals

**Goals:**

- Restore expected Backspace behavior in the controlled input renderer.
- Make deletion after slash completion remove the previous character from the completed command.
- Keep slash-mode filter state synchronized while deleting.
- Close the command panel when deletion removes the leading `/` or empties input.
- Add focused regression tests that cover the actual terminal key mapping.

**Non-Goals:**

- Do not add new command completion features.
- Do not redesign the input buffer architecture.
- Do not introduce a new keyboard parser dependency.
- Do not require exact forward-delete support unless the input layer can distinguish it from terminal Backspace.

## Decisions

### Treat `key.delete` as backward deletion in text-entry contexts

In the controlled input box, both `key.backspace` and `key.delete` should remove the character before the cursor. This matches the previous `ink-text-input` behavior and restores the common terminal Backspace path.

Alternative considered: keep `key.delete` as forward-delete and require users to send `key.backspace`. This fails in common terminals where Backspace is reported as `key.delete` by Ink.

### Keep forward delete conservative

True forward-delete support should only be added if the input layer can reliably distinguish the Delete key sequence from Backspace. Ink's current hook exposes both terminal Backspace (`\x7f`) and Delete-related sequences through `key.delete`, so preserving user-visible Backspace is the safer default.

Alternative considered: inspect raw terminal bytes directly outside Ink. That is broader than this regression fix and risks bypassing the existing focus-routing model.

### Let deletion update slash mode through the normal input-change path

Deletion should call the same change path as printable input. If the resulting text starts with `/`, the command panel filter should update. If it no longer starts with `/`, slash mode should close. If it becomes empty, input focus should return to normal mode.

Alternative considered: special-case slash deletion in `App.tsx`. That would duplicate input-prefix state transitions and make future editing operations harder to reason about.

## Risks / Trade-offs

- [Risk] True forward-delete key behavior may be unavailable in the controlled input. → Prefer restoring expected Backspace behavior now; add raw-sequence support later only if a reliable input path exists.
- [Risk] Slash focus can still consume keys before the input renderer sees them. → Keep `App.tsx` slash handling limited to navigation, Escape, Enter, and Tab; text-edit keys should be processed by `InputBox`.
- [Risk] Tests may pass at helper level while TTY behavior fails. → Add tests for the terminal mapping specifically: `key.delete` at end-of-input must delete backward.
