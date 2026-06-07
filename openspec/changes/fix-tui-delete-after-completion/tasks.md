## 1. Delete Key Semantics

- [x] 1.1 Update controlled input deletion handling so `key.delete` removes the character before the cursor in normal text-entry contexts.
- [x] 1.2 Keep `key.backspace` behavior as backward deletion.
- [x] 1.3 Avoid introducing unreliable forward-delete behavior unless the raw terminal sequence can be distinguished safely.

## 2. Slash Mode Synchronization

- [x] 2.1 Ensure deletion uses the same input-change path as printable input so slash filtering updates after each deletion.
- [x] 2.2 Ensure deleting `/` to empty closes the command panel and returns focus to normal input mode.
- [x] 2.3 Ensure deleting completed commands such as `/help` keeps the command panel filtered by the shortened slash input.

## 3. Regression Tests

- [x] 3.1 Add a unit test proving `key.delete` at end-of-input deletes backward for ordinary text.
- [x] 3.2 Add a unit test proving `key.delete` after completed slash input deletes the last completed character.
- [x] 3.3 Add a regression test for deleting slash input down to empty and closing slash mode.
- [x] 3.4 Add or update tests so slash navigation keys remain separate from text-edit keys.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @kocode/ko-tui test`.
- [x] 4.2 Run `pnpm --filter @kocode/ko-tui typecheck`.
- [x] 4.3 Run `openspec validate --all --strict`.
- [x] 4.4 Run `pnpm bundle` if TUI source changes affect the packaged CLI.
- [x] 4.5 Perform a real TTY check for `/` Tab completion followed by erase-key deletion, ordinary text deletion, and deleting slash input to close the panel.
