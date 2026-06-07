# TUI 规范

修改 `packages/ko-tui` 时遵守本文件。

## 核心原则

- 输入框、命令面板、模态框、权限弹窗、工具输出都必须通过焦点模式协调。
- 不要让多个组件同时抢同一组按键。
- 运行状态不能破坏用户正在输入的草稿。
- UI 状态要能从事件流稳定恢复，不要依赖隐式顺序假设。

## 焦点模式

现有焦点模式由 `focus.ts` 管理。新增键盘行为时先确认当前模式：

- `input`
- `slash`
- `status-modal`
- `model-modal`
- `theme-modal`
- `session-modal`
- `permission`
- `rewind-confirm`
- `tool-output`
- `history-search`

规则：

- 权限弹窗打开时必须独占 Up/Down/Enter/Escape/数字选择键。
- 模态框打开时，全局快捷键不能误触发输入、slash 导航或 rewind。
- Escape 行为要按模式分发，不能直接全局处理。

## 输入框

修改 `InputBox.tsx` 时检查：

- running=true 时输入草稿是否保留。
- modal 打开/关闭后草稿是否保留。
- 权限弹窗批准/拒绝后草稿是否保留。
- 多行输入、历史搜索、外部编辑器是否仍能工作。

## Turn 渲染

修改 `useTurns.ts`、`Turn.tsx`、`ToolCallCard.tsx` 时检查：

- `user_message` 是否正确开启新 Turn。
- `message_delta` 是否正确合并。
- tool start/end 是否能稳定配对。
- 重复 toolcall_end 不应造成重复 UI 或重复执行假象。
- turn completion marker 的耗时和状态是否正确。

## Slash Commands

修改 `commands.ts` 时：

- 命令名称、描述、handler 要保持一致。
- 涉及 Agent 状态的命令通过 `AgentSession` 公共方法完成。
- 需要 UI 面板的命令不要把复杂 UI 塞进文本 formatter。
- 新命令要有过滤、选择和 handler 测试。

## 测试重点

按影响范围添加或更新：

- `InputBox.test.ts`
- `commands.test.ts`
- `focus.test.ts`
- `PermissionDialog.test.ts`
- `ToolCallCard.test.ts`
- `useTurns.test.ts`
- `turnCompletion.test.ts`

至少运行：

```bash
pnpm --filter @kocode/ko-tui test
pnpm test
```
