# AGENTS.md

koCode 是一个终端 AI 编码助手：TypeScript + pnpm monorepo，支持多 Provider LLM、Ink/React TUI、JSONL 会话、权限、分支和回退。

这个文件只做入口路由。不要把所有规则都塞进这里；按任务类型渐进读取 `.agents/rules/` 下的细则。

## 先读什么

每次开始工作先读：

- `.agents/rules/workflow.md`：通用工作方式、改动边界、何时询问
- 本文件的“项目地图”和“常用命令”

然后按任务继续读取：

| 任务类型 | 继续读取 |
| --- | --- |
| 新功能、行为变更、需求不明确 | `.agents/rules/openspec.md` |
| 触碰包边界、公共 API、架构依赖 | `.agents/rules/packages.md` |
| 修改终端 UI、输入、焦点、命令面板、模态框 | `.agents/rules/tui.md` |
| 修改 Agent 循环、工具、权限、会话、用量、回退 | `.agents/rules/agent-tools.md` |
| 修改 CLI、配置、打包产物、测试或提交 | `.agents/rules/verification-git.md` |

## 项目地图

依赖方向固定：

```text
ko-ai -> ko-agent -> ko-tui -> ko-cli
```

- `packages/ko-ai`：Provider 抽象、流式事件、模型目录、OpenAI/Anthropic/Google/兼容 Provider 适配
- `packages/ko-agent`：AgentSession、工具执行、权限、会话持久化、checkpoint/rewind、usage/cost
- `packages/ko-tui`：Ink/React TUI、输入路由、焦点模式、slash commands、turn 渲染、主题
- `packages/ko-cli`：CLI 入口、参数解析、配置命令、会话和模型子命令
- `openspec/`：正式规格、变更提案、设计、任务和归档
- `packages/ko-cli/bin/kocode.mjs`：打包后的 CLI 产物；源码相关变更影响 CLI 时需要重新生成

## 常用命令

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev
pnpm bundle
openspec status
openspec validate --all --strict
```

单包测试示例：

```bash
pnpm --filter @kocode/ko-agent test
pnpm vitest run packages/ko-tui/src/__tests__/InputBox.test.ts
```

## 默认验证

- 普通代码改动：`pnpm typecheck && pnpm test`
- 影响编译/包引用：再跑 `pnpm build`
- 影响 CLI 运行或打包源码：再跑 `pnpm bundle`
- 影响 OpenSpec 或公开行为：再跑 `openspec validate --all --strict`

## 关键约束

- 开发必须先新建分支；禁止直接在 `main`、`develop`、`test` 上进行代码或文档改动。
- 分支命名使用 `<type>/<short-description>`，例如 `feature/add-model-cache`、`fix/session-store-path`。
- 不要反向依赖：低层包不能依赖高层包。
- 不要绕过工具权限、会话存储和焦点路由。
- 测试不得依赖真实用户目录；会话测试使用 `KOCODE_SESSIONS_DIR` 或临时目录。
- 不要提交无关改动；提交前确认 `git status --short`。
