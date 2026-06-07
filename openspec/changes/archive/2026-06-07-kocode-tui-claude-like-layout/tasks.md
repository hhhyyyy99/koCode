## 1. Layout Foundation

- [x] 1.1 Add or update a TUI helper for computing terminal-width horizontal separators with a stable fallback width.
- [x] 1.2 Replace hard-coded separator construction in `App.tsx` with the shared width-aware separator logic.
- [x] 1.3 Add focused tests for separator length fallback and explicit width behavior.

## 2. Header and Welcome Layout

- [x] 2.1 Update `Header.tsx` formatting to omit logo artwork and render compact version/model/cwd hierarchy.
- [x] 2.2 Update `Welcome.tsx` to stop rendering ASCII logo artwork and make the compact header the startup identity surface.
- [x] 2.3 Update header/welcome tests to assert version, model, context, cwd, absence of logo artwork, and command discovery via `/`.

## 3. Input Frame

- [x] 3.1 Render the input row between full-width separator lines matching the reference layout.
- [x] 3.2 Preserve existing prompt symbol, placeholder, multiline input, history search, running draft, and slash-mode behavior.
- [x] 3.3 Update input/App tests to verify the separator-frame layout and no rounded/rectangular input border.

## 4. Slash Command Panel

- [x] 4.1 Remove the rounded border from `CommandPanel.tsx` and render it as an unbordered completion list below the input separator.
- [x] 4.2 Align command rows into marker, command-name, and description columns, preserving the `❯` marker on the selected row.
- [x] 4.3 Add optional source/scope metadata rendering on a dimmed continuation line when command metadata exists.
- [x] 4.4 Add wrapping or truncation handling so long descriptions remain aligned with the description column.
- [x] 4.5 Update command panel/App tests for unbordered rendering, column alignment, selection marker, filtering, metadata display, and adjacency to the input separator.

## 4b. Review Follow-Up

- [x] 4b.1 Update `tui-welcome-screen` delta so the existing welcome spec no longer conflicts with the Claude-like empty-state layout.
- [x] 4b.2 Render slash command completions before the status bar while slash mode is active.
- [x] 4b.3 Re-run real TTY verification for startup, `/`, `/mod`, Escape close, and `/quit`, confirming the status bar no longer separates input from command completions.

## 5. Verification

- [x] 5.1 Run the relevant `ko-tui` unit tests.
- [x] 5.2 Run the full test suite if the targeted tests pass.
- [x] 5.3 Start the TUI in a real terminal and verify startup, `/` command list, filtering, selection, Escape close, and normal prompt submission.
- [x] 5.4 Compare the final layout against the provided Claude reference and record any remaining visual differences.
