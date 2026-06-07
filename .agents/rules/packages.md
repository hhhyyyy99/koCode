# 包边界与架构规范

koCode 是 pnpm monorepo。包依赖方向固定：

```text
ko-ai -> ko-agent -> ko-tui -> ko-cli
```

不要让低层包依赖高层包。

## `@kocode/ko-ai`

职责：

- Provider 抽象和适配
- 流式事件协议
- 模型目录
- API key 注入
- OpenAI/Anthropic/Google/兼容 Provider 行为

修改规则：

- Provider 事件要保持统一协议。
- 新模型或 Provider 变更要考虑 `models.generated.ts`、`models.ts`、`provider-registry.ts`。
- 工具调用格式转换要兼容上层 `ko-agent`。
- 不引入 TUI 或 CLI 依赖。

## `@kocode/ko-agent`

职责：

- AgentSession 主循环
- 工具注册和执行
- 权限模式
- 会话存储、分支、恢复
- checkpoint/rewind
- usage/cost/context 统计

修改 Agent 或工具时继续读 `.agents/rules/agent-tools.md`。

## `@kocode/ko-tui`

职责：

- Ink/React UI
- 输入框、命令面板、模态框
- 焦点路由
- Turn 渲染
- 主题、语法高亮、输入历史

修改 TUI 时继续读 `.agents/rules/tui.md`。

## `@kocode/ko-cli`

职责：

- CLI 参数解析
- 配置命令
- 模型解析
- `sessions` 和 `models` 子命令
- 启动 TUI 或 print 模式

修改 CLI 时：

- 保持源码和 `packages/ko-cli/bin/kocode.mjs` 一致。
- 影响运行入口、包导出或依赖打包时运行 `pnpm bundle`。
- 配置路径默认仍遵守项目/用户两级：项目 `.kocode/config.yaml` 优先，否则 `~/.kocode/config.yaml`。

## 跨包修改

跨包修改前先确认：

- 类型是否通过包边界导出。
- 是否破坏 TypeScript project references。
- 是否需要更新多个包的测试。
- 是否需要更新 OpenSpec。
