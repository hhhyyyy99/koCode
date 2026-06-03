## Why

koCode 多 Provider CLI 助手已基本可用（88/88 任务完成），但 Provider 配置系统和 TUI 交互体验还有明显短板：自定义模型定义缺少 compat 接入和模型发现，配置文件无校验导致配置错误静默忽略，缺少 `config` 管理命令，TUI 缺乏 Markdown 渲染、diff 预览和多行输入。

## What Changes

- **自定义模型定义完善**: 自定义模型在 `/models` 列表中可见，compat 配置完整接入 Provider 适配器
- **配置校验**: 加载配置时做 schema 校验，对必填字段缺失、类型错误给出明确报错
- **kocode config 命令**: 支持 `config show/get/set/unset/open/path/init` 子命令，点号分隔路径访问嵌套字段
- **TUI Markdown 渲染**: 集成 ink-markdown，代码块、粗体、链接、列表正确渲染
- **TUI diff 预览**: Edit 工具结果以绿色 + / 红色 - 的 diff 风格展示
- **TUI 多行输入**: Alt+Enter 换行，Enter 提交

## Capabilities

### New Capabilities

- `config-management`: 配置校验与 config 命令，覆盖配置文件 schema 校验、get/set/unset/show/open/path/init 子命令
- `tui-enhancement`: TUI 增强，覆盖 Markdown 渲染、diff 预览、多行输入

### Modified Capabilities

- `multi-provider-api`: 自定义模型的 compat 字段完整接入 Provider 适配器
- `cli-entry`: 新增 config 子命令，resolveModel 支持自定义模型收集

## Impact

- 新增依赖: ink-markdown
- 修改文件: ko-cli/src/index.ts, ko-tui/src/Conversation.tsx, ko-tui/src/InputBox.tsx, ko-tui/src/App.tsx, ko-ai/src/models.ts
- 新增文件: ko-cli/src/config-command.ts, ko-tui/src/DiffView.tsx
