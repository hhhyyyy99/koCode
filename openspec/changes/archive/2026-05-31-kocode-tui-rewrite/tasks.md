## 1. Agent 层: 事件模型补充

- [x] 1.1 在 `events.ts` 的 `AgentSessionEvent` 联合类型中新增 `user_message` 事件变体（包含 type、content、images? 字段）
- [x] 1.2 在 `agent-session.ts` 的 `prompt()` 方法中，push 用户消息后 emit `user_message` 事件

## 2. TUI 基础设施

- [x] 2.1 创建 `commands.ts`：命令注册表，包含所有内置命令的 name、description、handler，导出 `getCommands()` 和 `filterCommands(query: string)` 函数
- [x] 2.2 创建 `useTurns.ts`：`useTurns(events: AgentSessionEvent[])` hook，将事件流转换为 `Turn[]` 列表 + 当前活跃 Turn 状态，处理 user_message 创建新 Turn、message_delta 累积文本、tool_start/end 记录工具调用、thinking_delta 累积思考内容、turn_end 标记完成
- [x] 2.3 定义 Turn 相关的 TypeScript 类型（Turn、TurnBlock、ToolCallState 等），放在 `ko-tui/src/types.ts`

## 3. Header 组件

- [x] 3.1 创建 `Header.tsx`：渲染 koCode ASCII art logo、版本号、当前模型名（provider/id）、工作目录路径
- [x] 3.2 Header 接收 `model: Model` 和 `cwd: string` props，纯展示组件

## 4. 对话渲染组件

- [x] 4.1 创建 `UserBubble.tsx`：渲染单条用户消息，使用 "❯" 前缀 + bold 样式，支持纯文本和图片附件显示
- [x] 4.2 创建 `AssistantBlock.tsx`：渲染助手文本内容，使用现有 Markdown 组件，支持流式更新（text prop 变化时平滑更新）
- [x] 4.3 创建 `ToolCallCard.tsx`：渲染工具调用卡片，包含工具名标题行、折叠/展开状态、输入参数摘要、运行中 spinner、完成后的 ✓/✗ 状态标记、结果内容预览
- [x] 4.4 创建 `ThinkingBlock.tsx`：渲染思考内容，默认折叠为一行 "💭 Thinking..." 提示，展开后显示完整思考文本（dim 样式）
- [x] 4.5 创建 `Turn.tsx`：组合 UserBubble + AssistantBlock + ToolCallCard[] + ThinkingBlock[]，接收 Turn 数据和 streaming 标志

## 5. 命令面板

- [x] 5.1 创建 `CommandPanel.tsx`：接收 `filterText: string` 和 `onSelect: (command) => void` props，渲染过滤后的命令列表（命令名 + 描述），高亮当前选中项
- [x] 5.2 实现键盘导航：`↑↓` 移动选择、`Enter` 确认选择、`Escape` 通知关闭

## 6. Conversation 组件

- [x] 6.1 重写 `Conversation.tsx`：使用 `useTurns` hook 获取 turns 列表和活跃 turn
- [x] 6.2 使用 `<Static>` 渲染已完成的 turns（status === "complete"），每个 turn 用 `<Turn>` 渲染
- [x] 6.3 使用普通 `<Box>` 渲染当前 streaming 的活跃 turn
- [x] 6.4 处理空状态：无消息时显示 placeholder 提示
- [x] 6.5 处理错误状态：显示 agent_error 事件内容

## 7. InputBox 组件

- [x] 7.1 重写 `InputBox.tsx`：添加 `borderStyle="single"` 边框包裹输入区
- [x] 7.2 添加 placeholder 文本（"输入消息，或 / 查看命令..."），在输入为空时显示
- [x] 7.3 实现多行输入：Enter 提交、Alt+Enter（或 Option+Enter）插入换行、Ctrl+J 插入换行
- [x] 7.4 添加 IME composition 状态跟踪，composition 期间不触发命令面板
- [x] 7.5 在输入框下方显示键盘快捷键提示行
- [x] 7.6 检测输入以 `/` 开头时，通知父组件显示命令面板

## 8. StatusBar 组件

- [x] 8.1 重写 `StatusBar.tsx`：增强视觉层次，running 时显示带颜色的 "⚡ thinking" 指示器
- [x] 8.2 使用 `justifyContent="space-between"` 左右分布：左侧模型名，右侧 token 用量 + session ID

## 9. App 根组件

- [x] 9.1 重写 `App.tsx`：组合 Header + Conversation + CommandPanel + InputBox + StatusBar，使用 flexDirection="column"，Conversation 占 flex-grow
- [x] 9.2 管理全局状态：slashMode（命令面板开关）、events 列表、model、usage、running、sessionId
- [x] 9.3 管理命令面板交互：slashMode 时拦截 `↑↓ Enter Escape` 键盘事件传递给 CommandPanel
- [x] 9.4 管理分隔线渲染：slashMode 时在输入框和命令面板之间显示分隔线
- [x] 9.5 管理命令选择回调：选中命令后填入输入框并退出 slashMode
- [x] 9.6 处理 Ctrl+C：退出应用（exitOnCtrlC）

## 10. 入口文件更新

- [x] 10.1 更新 `run.ts`：传递新增的 props（cwd 等）到 App 组件

## 11. 验证

- [x] 11.1 `pnpm typecheck` 通过，无类型错误
- [x] 11.2 `pnpm build` 通过，所有包编译成功
- [x] 11.3 `pnpm test` 通过，无回归（40 tests）
- [x] 11.4 手动验证：启动 TUI，确认 Header 显示、命令面板交互、多轮对话 Turn 分组、工具卡片折叠/展开、输入框多行、状态栏状态切换
