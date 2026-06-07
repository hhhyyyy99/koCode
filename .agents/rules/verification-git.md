# 验证、打包与 Git 规范

本文件适用于测试、构建、打包、提交相关任务。

## 验证矩阵

按改动范围选择：

| 改动范围 | 验证命令 |
| --- | --- |
| 类型或 API | `pnpm typecheck` |
| 普通代码 | `pnpm test` |
| project references、包导出、编译配置 | `pnpm build` |
| CLI 入口、运行时依赖、打包源码 | `pnpm bundle` |
| OpenSpec 或公开行为 | `openspec validate --all --strict` |

推荐默认组合：

```bash
pnpm typecheck
pnpm test
```

## 测试隔离

- 测试不得依赖真实 `~/.kocode` 可写。
- 会话测试使用 `KOCODE_SESSIONS_DIR`。
- 临时文件放在系统 tmp 或测试专用目录。
- 测试失败时先区分真实失败和环境权限失败。

## 打包规则

`packages/ko-cli/bin/kocode.mjs` 是分发 CLI 产物。

需要运行 `pnpm bundle` 的情况：

- 修改 `ko-cli` 入口。
- 修改 `ko-tui`、`ko-agent`、`ko-ai` 中会影响 CLI 运行的源码。
- 修改 bundle 配置或运行时依赖。
- 修复只在打包产物中可见的问题。

如果 bundle 失败，先判断是源码错误、依赖解析问题，还是可选依赖需要 external。

## 分支规则

开发必须先从 `main` 新建分支，禁止直接在 `main` 上进行代码或文档改动。

开始工作前：

```bash
git branch --show-current
git status --short
```

如果当前在 `main`，先创建任务分支：

```bash
git checkout -b feature/<short-description>
```

允许的分支类型：

| 类型 | 用途 | 示例 |
| --- | --- | --- |
| `feature/` | 新功能、能力增强 | `feature/model-selector` |
| `fix/` | bug 修复、行为修正 | `fix/session-store-path` |
| `docs/` | 文档、规范、说明 | `docs/ai-rules-routing` |
| `test/` | 测试补充或测试隔离 | `test/session-storage-isolation` |
| `refactor/` | 不改变行为的重构 | `refactor/provider-registry` |
| `chore/` | 构建、依赖、工具配置 | `chore/bundle-externals` |
| `perf/` | 性能优化 | `perf/stream-buffering` |

命名规则：

- 使用 `<type>/<short-description>`。
- `short-description` 使用小写 kebab-case。
- 不使用空格、下划线、中文或大写字母。
- 保持简短，通常 2-4 个单词。
- 一个分支只承载一个逻辑变更。

如果已经在 `main` 上产生了未提交改动，不要继续扩大改动；先创建合适分支把当前改动带过去：

```bash
git checkout -b docs/ai-rules-routing
```

## Git 工作流

提交前：

```bash
git status --short
pnpm typecheck
pnpm test
```

规则：

- 只 stage 本次任务相关文件。
- 不提交无关格式化、缓存、临时文件。
- 不回滚用户未要求回滚的改动。
- 如果已有无关 dirty 文件，避开它们；必要时说明。
- 提交必须发生在任务分支上；如果当前分支是 `main`，先停止并创建分支。

## Commit Message

使用 Conventional Commits：

```text
feat(ko-tui): add model selector modal
fix(ko-agent): dedupe repeated tool calls
test: isolate session storage
docs: route ai rules through claude
chore: update bundle externals
```

常用 type：

- `feat`
- `fix`
- `refactor`
- `docs`
- `chore`
- `test`
- `perf`

scope 优先用包名：`ko-ai`、`ko-agent`、`ko-tui`、`ko-cli`。跨包或文档类可以省略。

提交说明规则：

- 格式：`type(scope): subject` 或 `type: subject`。
- subject 使用英文小写祈使句，不加句号。
- subject 控制在 72 个字符以内。
- 一个 commit 只表达一个逻辑变更。
- 不使用 `wip`、`update`、`misc` 这类模糊信息作为最终提交。
- 如果改动包含破坏性变更，在正文写 `BREAKING CHANGE:` 并说明迁移方式。

提交前检查暂存内容：

```bash
git diff --cached --stat
git diff --cached --name-only
```
