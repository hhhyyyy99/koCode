## Why

`kocode-tui-rewrite` 建立了 Turn 分组架构，但视觉呈现与 Claude Code 仍有本质差距：工具卡片格式不对标（`⚙` vs `●`、无 `⎿` 前缀、无行号）、缺失回合完成标记、无 `! @ #` 输入前缀、无语法高亮、无输出截断、无权限对话框。用户在同一设备上反复交叉验证 Claude Code 后，要求完全对齐——不只是看起来像，而是交互细节、视觉符号、功能行为都一致。

## What Changes

### Phase 0 — 交互完整性重置（优先级最高）
- **输入控制权**: Agent 运行中仍保留输入区和用户草稿，不用 `● Thinking...` 替换输入入口
- **焦点模型**: 明确 Input / Slash Panel / Modal / Permission / Tool Focus 的互斥关系，避免快捷键互相抢占
- **工具卡片可操作性**: `ctrl+o to expand` 必须对应真实可用的展开/折叠行为；工具卡片焦点状态可见
- **权限中断体验**: 权限弹窗必须是明确 modal，批准/拒绝后工具流继续可见且状态恢复正确
- **TTY 验收门槛**: 所有视觉/功能对齐项必须经过真实 `pnpm dev` 交互验收，不能只以组件存在或单测通过为完成

### Tier 1 — 视觉对齐（2-3 天）
- **工具卡片重对齐**: 符号 `●`/`⎿`、`ToolName(params)` 格式、行号标注、输出截断 `… +N lines`
- **回合完成标记**: `✻ Baked for Xs` 趣味动词 + 耗时显示
- **输入前缀系统**: `!` Shell 直接执行、`#` 快速记忆、`@` 文件引用（基础版，不含自动补全）
- **底部状态栏**: 恢复但按 Claude Code 样式（左：快捷键提示，右：模式指示）
- **代码块语法高亮**: 基于 tokenizer 的关键字/字符串/注释着色
- **Welcome 欢迎屏幕**: 替代当前空状态「No messages yet」

### Tier 2 — 功能对齐（1-2 周）
- **权限系统**: 文件创建/编辑/Bash 确认对话框 + 3 级权限模式（Default/Accept Edits/Auto）
- **/context 上下文可视化**: 树状 token 占用分析
- **/cost 费用追踪**: 按模型分列的 token 使用 + 费用
- **/status 状态面板**: Settings/Status/Usage 多 Tab
- **模型选择器 UI**: 交互式选择列表
- **输入历史搜索**: Ctrl+R

### Tier 3 — 高级功能（1 月+）
- **会话分支/恢复**: /branch、/resume
- **检查点回退**: Esc Esc 回退代码状态
- **主题系统**: dark/light/ANSI/custom
- **外部编辑器集成**: Ctrl+G / Ctrl+X Ctrl+E
- **MCP 管理界面**: /mcp 管理外部工具

## Capabilities

### New Capabilities

- `tui-tool-card-realignment`: 工具卡片符号、格式、行号、截断对齐 Claude Code
- `tui-turn-completion-marker`: 回合完成标记 ✻ + 趣味动词 + 耗时
- `tui-input-prefix-system`: `!` Shell 执行、`#` 快速记忆、`@` 文件引用
- `tui-status-bar`: 底部状态栏（快捷键提示 + 模式指示器）
- `tui-syntax-highlight`: 代码块关键字/字符串/注释着色
- `tui-welcome-screen`: 替换空状态的欢迎屏幕（Logo + 信息层次）
- `tui-permission-system`: 文件/Bash 权限确认对话框 + 3 级权限模式
- `tui-context-visualization`: /context 命令的 token 占用树状视图
- `tui-cost-tracking`: /cost 命令的 token 费用统计
- `tui-status-panel`: /status 多 Tab 状态面板
- `tui-model-selector`: 交互式模型选择器 UI
- `tui-input-history`: Ctrl+R 输入历史搜索
- `tui-session-branching`: /branch + /resume 会话分支与恢复
- `tui-checkpoint-system`: Esc Esc 代码/对话状态回退
- `tui-theme-system`: 多主题切换
- `tui-external-editor`: Ctrl+G 外部编辑器集成

### Modified Capabilities

- `tui-command-panel`: 命令清单从 8 个扩展到 20+ 个，新增分类（会话/信息/配置/开发）
- `tui-turn-based-conversation`: 添加 turn completion marker、工具卡片内增强 diff 显示
- `tui-header`: 添加 welcome 模式下更丰富的信息层次
- `tui-enhanced-input`: 扩展为多前缀系统（! @ # /），添加历史搜索
- `agent-events`: 新增 `shell_exec`、`permission_request` 等事件类型以支持权限系统和 ! 前缀

### Scope Reframe

本变更不再按“Claude Code 功能清单逐项堆齐”推进。当前主要缺口是 **TUI interaction integrity**：输入、焦点、工具透明度、权限中断、状态反馈这条主循环必须先稳定。只有 Phase 0 通过真实 TTY 验收后，Tier 1/2/3 的功能对齐才有意义。

## Impact

- 新增依赖: 可能需要 `highlight.js` 或自行实现轻量 tokenizer（`ko-tui`）
- 修改文件: `ko-tui/src/*`（大部分组件）、`ko-agent/src/events.ts`、`ko-agent/src/agent-session.ts`
- 新增文件: `ko-tui/src/syntaxHighlight.ts`、`ko-tui/src/Welcome.tsx`、`ko-tui/src/StatusBar.tsx`（重写）、`ko-tui/src/PermissionDialog.tsx`、`ko-tui/src/ModelSelector.tsx`、`ko-tui/src/StatusPanel.tsx`、`ko-tui/src/ContextView.tsx` 等
- 不移除文件: 保留现有架构，增量增强
