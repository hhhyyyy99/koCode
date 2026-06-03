## Why

当前 TUI 实现只是 5 个基础组件的简单堆砌——没有 Header 品牌区、没有交互式命令面板、对话渲染平铺所有事件流、输入框只有一个 `>` 提示符——与 Claude Code 的终端体验完全不在同一水平。上一个变更 `kocode-config-tui-enhance` 补了 Markdown 渲染、diff 预览、多行输入的基础功能，但架构层面仍是平铺式渲染，缺乏 Turn 分组、命令交互、视觉层次。这次需要从架构层重写，对标 Claude Code 的完整终端体验。

## What Changes

- **TUI 架构重写**: 从平铺事件渲染改为 Turn 分组模型，每个 Turn 包含用户消息 + 助手回复（文本/工具调用/thinking）
- **Header 组件**: 新增 ASCII art logo + 版本号 + 模型名 + 工作目录展示
- **交互式命令面板**: 输入 `/` 弹出可过滤、可键盘导航的命令列表（出现在输入框下方）
- **Turn 分组对话**: Conversation 拆分为 UserBubble + AssistantBlock + ToolCallCard + ThinkingBlock，工具卡片支持折叠/展开
- **增强输入框**: 带边框、placeholder 的多行输入区，右侧显示快捷键提示
- **增强状态栏**: 更丰富的模型、token、会话信息展示
- **事件模型补充**: Agent 层新增 `user_message` 事件，让事件流成为会话的完整记录
- **终端滚动**: 已完成的 Turn 使用 Ink `<Static>` 渲染，当前 Turn 使用普通 Box 流式更新

## Capabilities

### New Capabilities

- `tui-header`: Logo + 版本 + 模型 + 工作目录的品牌 Header
- `tui-command-panel`: 交互式斜杠命令面板，/ 触发、实时过滤、键盘上下选择、Enter 确认
- `tui-turn-based-conversation`: Turn 分组的对话渲染，UserBubble / AssistantBlock / ToolCallCard / ThinkingBlock
- `tui-enhanced-input`: 带边框的多行输入框，placeholder 和快捷键提示
- `tui-enhanced-status`: 增强状态栏，running/idle 状态区分

### Modified Capabilities

- `agent-events`: 新增 `user_message` 事件类型，让 TUI 层可通过事件流完整重放会话
- `tui-enhancement`: 原有的 Markdown、diff、多行输入被新架构完整替换

## Impact

- 新增依赖: 无（仍在 Ink 5 + React 18 框架内）
- 修改文件: `ko-agent/src/events.ts`, `ko-agent/src/agent-session.ts`, `ko-tui/src/*`（全部 5 个组件 + run.ts）
- 新增文件: `ko-tui/src/Header.tsx`, `ko-tui/src/Turn.tsx`, `ko-tui/src/UserBubble.tsx`, `ko-tui/src/AssistantBlock.tsx`, `ko-tui/src/ToolCallCard.tsx`, `ko-tui/src/ThinkingBlock.tsx`, `ko-tui/src/CommandPanel.tsx`, `ko-tui/src/useTurns.ts`, `ko-tui/src/commands.ts`
- 移除文件: 无（旧组件原地重写/替换）
