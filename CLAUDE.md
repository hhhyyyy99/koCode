# CLAUDE.md

Terminal-based AI coding assistant with multi-provider LLM support (Anthropic, OpenAI, Google, DeepSeek + OpenAI-compatible providers). Ink/React TUI, JSONL sessions with branching/rewind.

## Development Guidelines

> Derived from Andrej Karpathy's observations on LLM coding pitfalls ([source](https://github.com/multica-ai/andrej-karpathy-skills)). These bias toward caution over speed — use judgment for trivial tasks.

### Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.
- Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

Touch only what you must. Clean up only your own mess.

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Notice unrelated dead code → mention it, don't delete it.
- Your changes created orphan imports/vars/functions → remove them.
- Pre-existing dead code → leave it alone unless asked.
- Every changed line should trace directly to the user's request.

### Goal-Driven Execution

Define success criteria. Loop until verified.

- "Add validation" → write tests for invalid inputs, then make them pass.
- "Fix the bug" → write a test that reproduces it, then make it pass.
- "Refactor X" → ensure tests pass before and after.
- Multi-step tasks → state a brief plan with verifiable checks.

## Commands

```bash
pnpm install              # install deps
pnpm build                # tsc -b (project references)
pnpm typecheck            # tsc -b --pretty
pnpm test                 # vitest run --config vitest.config.ts
pnpm vitest run packages/ko-ai/src/__tests__/stream.test.ts  # single test
pnpm dev                  # tsx packages/ko-cli/src/index.ts
pnpm bundle               # node scripts/bundle.mjs -> packages/ko-cli/bin/kocode.mjs
pnpm clean                # rm dist + tsbuildinfo across all packages
```

Per-package: `pnpm --filter @kocode/ko-ai test` (build, typecheck, test).

## Architecture

```
ko-ai   (provider abstraction, streaming, model catalogue)
  ↑
ko-agent (agent loop, session persistence, tools, permissions)
  ↑
ko-tui   (Ink/React TUI, 18 components, 25 slash commands)
  ↑
ko-cli   (CLI entry, config, arg parsing)
```

Build order follows this graph via TypeScript project references.

### `@kocode/ko-ai`

3 provider adapters (`providers/anthropic.ts`, `openai.ts`, `google.ts`). DeepSeek and other OpenAI-compatible providers (Groq, Together, OpenRouter, Qwen) share the OpenAI adapter via `compat.ts` (`OpenAICompletionsCompat`/`AnthropicMessagesCompat` flags).

- `top-level.ts` — public API: `stream()`, `complete()`, `streamSimple()`, `completeSimple()` (tool-free)
- `stream.ts` — `AssistantMessageEventStream` (push + AsyncIterable). Event contract: start → text/thinking/toolcall deltas → done|error (12 event types in `events.ts`)
- `provider-registry.ts` — global `ApiType` → `ApiProvider` registry with lazy loading
- `models.generated.ts` — model catalogue (8 models: anthropic×3, openai×2, google×2, deepseek×1)
- `env-api-keys.ts` — 9 provider env vars (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.) + KOCODE_API_KEY fallback

### `@kocode/ko-agent`

- `agent-session.ts` — `AgentSession`: prompt → stream → tool execute → repeat. Checkpoint/rewind, auto-compaction at 80% context window, tool deduplication, usage tracking
- `session-store.ts` — JSONL in `~/.kocode/sessions/` (create/load/list/branch/delete/rename)
- `system-prompt.ts` — builds system prompt from tool defs + `.kocode/` + `context.md` + `CLAUDE.md`
- `tool-permissions.ts` — modes: `default`, `accept_edits`, `auto`. Categories: read, write, edit, bash, unknown
- `events.ts` — `AgentSessionEvent` (21 variants), `ThinkingLevel`, `CompactionResult`
- `tools/index.ts` — 7 tools: read, edit, write, bash, grep, find, ls. Path sandboxing, bash policy (allow/deny), JSON Schema validation

### `@kocode/ko-tui`

18 components, 7 support modules.

- `App.tsx` — main: event handling, focus, modals, input routing
- `useTurns.ts` — `AgentSessionEvent[]` → `Turn[]` conversation state
- `commands.ts` — 25 slash commands (/help, /clear, /compact, /resume, /branch, /model, /models, /config, /init, /permissions, /theme, /diff, /rewind, /status, /session, /context, /cost, /review, /doctor, /export, /skills, /feedback, /quit, /exit)
- `focus.ts` — 10 modes: input, slash, status-modal, model-modal, theme-modal, session-modal, permission, rewind-confirm, tool-output, history-search
- `input-prefix.ts` — `!` shell, `#` memory, `/` commands, `@` file references
- `theme.ts` — 8 themes: auto, dark, light, dark-colorblind, light-colorblind, ansi-dark, ansi-light, ansi
- `syntaxHighlight.ts` — tokenizer for Python, TypeScript, JavaScript, Go, Rust, Bash
- `input-history.ts` — history with search (100-entry limit)

### `@kocode/ko-cli`

2 files. Entry point + config command.

- `index.ts` — arg parsing (`--provider`, `--model`, `--session`, `--print`), stdin pipe input, `sessions` subcommand (list/delete/rename), `models` subcommand. Model resolution: custom config → built-in by provider → search all providers
- `config-command.ts` — YAML config (`~/.kocode/config.yaml` or `.kocode/config.yaml`). Subcommands: show, get, set, unset, open, path, init

## Git Workflow

### Branch Strategy

**NEVER commit directly to `main`.** Always create a feature branch before making changes.

Branch naming convention — use `<type>/<short-description>`:

| Type | Usage |
|------|-------|
| `feat/` | New feature (e.g. `feat/add-vim-mode`) |
| `fix/` or `bugfix/` | Bug fix (e.g. `fix/session-crash-on-branch`) |
| `refactor/` | Code refactoring with no behavior change |
| `docs/` | Documentation only |
| `chore/` | Tooling, deps, config, CI |
| `test/` | Adding or fixing tests |
| `perf/` | Performance improvement |

Rules:
- Description uses lowercase kebab-case, no spaces, no underscores
- Keep branch names concise (2–4 words)
- One branch per logical change; don't bundle unrelated work

### Commit Messages

Follow Conventional Commits:

```
type(scope): short description
```

- **type:** `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`
- **scope:** package name (`ko-ai`, `ko-agent`, `ko-tui`, `ko-cli`) or omit for cross-cutting changes
- Description: imperative mood, lowercase, no period at end, under 72 chars

Examples:
```
feat(ko-agent): add tool call deduplication
fix(ko-tui): handle empty input on rewind dialog
refactor(ko-ai): extract compat flags into shared types
chore: bump pnpm to 11.5.0
```

### Typical Workflow

```bash
git checkout -b feat/my-feature        # 1. create branch from main
# ... make changes ...
pnpm typecheck && pnpm test            # 2. verify before commit
git add <files>                        # 3. stage specific files
git commit -m "feat(scope): message"   # 4. commit
git push -u origin feat/my-feature     # 5. push (when ready)
```

## Technical Details

- **Module:** ESM (`"type": "module"`), NodeNext resolution, ES2022 target, strict mode
- **Path aliases:** `@kocode/ko-ai`, `@kocode/ko-agent`, `@kocode/ko-tui` → package source (in `tsconfig.base.json`)
- **Tests:** Vitest 3.1.4, tests in `src/__tests__/**/*.test.ts`. ko-tui/ko-cli use custom `resolveTsPlugin` (root `vitest-plugin.ts`) mapping `.js` → `.ts`. Workspace config in `vitest.workspace.ts`
- **Package manager:** pnpm 11.4.0, Node >= 20
- **Config:** `config.example.yaml` at project root documents all options (providers, custom models, custom headers)
- **Design docs:** `openspec/` — specs, archived change sets with proposals/designs/tasks
