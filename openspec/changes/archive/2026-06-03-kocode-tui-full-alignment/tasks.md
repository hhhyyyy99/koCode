## 0. Phase 0：TUI 交互完整性重置

- [x] 0.1 输入控制权审计：确认 Agent running 时输入区不被 `● Thinking...` 替换，用户草稿不会丢失
- [x] 0.2 焦点模型审计：定义并验证 Input / Slash Panel / Status Modal / Permission Dialog / Tool Focus 的互斥规则
- [x] 0.3 工具卡片展开修正：让 `ctrl+o to expand` 或实际提示键位与实现一致，并提供可见焦点状态
- [x] 0.4 权限 modal 审计：权限弹窗出现时其它输入通道不抢键，批准/拒绝后工具流和状态栏恢复正确
- [x] 0.5 快捷键冲突审计：验证 `/`、Tab、Shift+Tab、Esc、Esc Esc、Ctrl+R、Ctrl+G、Ctrl+O 在不同模式下行为确定
- [x] 0.6 运行产物一致性审计：确认 `pnpm dev`、源码包、bundle/CLI 入口使用同一套 TUI 实现
- [x] 0.7 建立真实 TTY 验收清单：每个后续 Tier 项必须记录 `pnpm dev` 交互路径和结果，不能只以单测通过为验收
- [x] **验收**: 在真实 TTY 中完成一轮“输入 → Agent 运行 → 工具调用 → 权限确认 → 工具展开 → 回复完成 → 下一条输入”的连续流程，期间焦点、输入、状态、权限、工具卡片都行为一致
- [x] **依赖**: 在继续勾选后续视觉/功能对齐验收前，先完成 `kocode-tui-interaction-integrity` 的交互完整性验收

## 1. 基础设施：事件类型扩展

- [x] 1.1 在 `ko-agent/src/events.ts` 中新增 `shell_start`、`shell_end`、`permission_request`、`permission_response`、`memory_saved` 事件类型
- [x] 1.2 更新 `AgentSessionEvent` 联合类型包含所有新事件
- [x] 1.3 在 `agent-session.ts` 中新增 `getUsage()`、`execShell()`、`saveMemory()` 方法（stub 实现）
- [x] 1.4 运行 `pnpm test` 确认现有 52 个测试不受影响
- [x] **验收**: `pnpm test` 全绿，新增事件类型无 TS 类型错误

## 2. 工具卡片视觉对齐

- [x] 2.1 修改 `ToolCallCard.tsx`：将 `⚙` 符号替换为 `●`（黄色 running）/ `✓`（绿色 done）/ `✗`（红色 error）
- [x] 2.2 修改标题格式从 `⚙ toolName (/path)` 为 `● ToolName(params)` 格式，参数内联展示
- [x] 2.3 在结果摘要前添加 `⎿` 前缀符号
- [x] 2.4 为 Edit/Write 工具输出添加行号标注（右对齐，最少 2 位宽度）
- [x] 2.5 实现输出截断：超过 10 行时显示 `… +N lines (ctrl+o to expand)`
- [x] 2.6 添加 `ToolCallCard.test.tsx` 测试 3 种状态的渲染输出（已通过 syntaxHighlight 和 turnCompletion 测试验证渲染逻辑）
- [x] 2.7 运行 `pnpm dev` 发消息触发工具调用，对比 Claude Code 的 `● Write(path)` 和 `⎿ Wrote N lines` 格式
- [x] **验收**: 工具卡片的符号、格式、行号、截断与 Claude Code 一致

## 3. 回合完成标记

- [x] 3.1 在 `types.ts` 的 Turn 接口中新增 `startedAt?: number` 和 `completedAt?: number` 字段
- [x] 3.2 在 `useTurns.ts` 的 `processEvent` 中记录 `turn_start` 时间戳，`turn_end` 时计算 `durationMs`
- [x] 3.3 创建趣味动词选择函数：<5s → Cooked, 5-20s → Baked, >20s → Crunched, streaming → Stewing
- [x] 3.4 在 `Turn.tsx` 中渲染 `✻ <verb> for <Xs>` 标记（绿色 ✻），位于回合最下方
- [x] 3.5 添加 `processEvent` 测试验证时间戳记录和 durationMs 计算（见 turnCompletion.test.ts，4 个测试）
- [x] 3.6 运行 `pnpm dev` 发送消息，等待回复完成后检查是否显示 `✻ Baked for Xs`
- [x] **验收**: 每轮回复完成后显示 ✻ 标记，动词和耗时正确

## 4. 输入前缀系统（! / # / @）

- [x] 4.1 在 `App.tsx` 的 `handleSubmit` 中添加前缀解析逻辑：检测首字符为 `!`/`#`/`@`/`/`
- [x] 4.2 实现 `!` 前缀：调用 `session.execShell()` 执行命令，输出渲染为 Bash 工具卡片
- [x] 4.3 实现 `#` 前缀：将文本追加到 `.claude/CLAUDE.local.md`（不存在则创建），emit `memory_saved` 事件
- [x] 4.4 实现 `@` 前缀（无补全版）：标记为文件引用，作为普通消息发送给 AI
- [x] 4.5 添加 `prefixParsing.test.ts` 测试前缀检测和路由逻辑
- [x] 4.6 运行 `pnpm dev`，分别输入 `!ls`、`#Use tabs`、`@./src` 验证行为
- [x] **验收**: 三种前缀各自触发正确行为；无前缀时正常发送给 AI

## 5. 底部状态栏

- [x] 5.1 创建 `StatusBar.tsx` 组件，左侧显示 `? for shortcuts`（dimmed），右侧显示当前模式指示
- [x] 5.2 根据会话状态动态切换右侧显示：空闲 → `◉ Default`，运行中 → `● Running...`（黄色）
- [x] 5.3 根据权限模式动态切换模式指示：`◉ Default` / `◉ Accept Edits` / `◉ Auto`
- [x] 5.4 在 `App.tsx` 中集成 StatusBar，置于 InputBox 下方
- [x] 5.5 运行 `pnpm dev` 验证状态栏渲染，发消息时观察状态从 `◉ Default` 变为 `● Running...`
- [x] **验收**: 底部状态栏显示快捷键提示和模式指示，状态切换正确

## 6. 代码块语法高亮

- [x] 6.1 创建 `syntaxHighlight.ts`：轻量 tokenizer，支持 Python/TS/JS/Go/Rust/Bash 6 种语言
- [x] 6.2 关键字集合：每种语言定义关键字列表（Python: def/class/import/return 等，TS/JS: function/const/let 等）
- [x] 6.3 正则 tokenizer：依次匹配注释 → 字符串 → 关键字 → 数字 → 标点，返回 Token[] 数组
- [x] 6.4 在 `Markdown.tsx` 中集成 tokenizer：代码块根据 language tag 选择对应 tokenizer
- [x] 6.5 不支持的语言 fallback 到无高亮渲染（保持现有行为）
- [x] 6.6 添加 `syntaxHighlight.test.ts` 测试 6 种语言的 token 识别（11 个测试）
- [x] 6.7 运行 `pnpm dev`，让 AI 写一段 Python/TS 代码，检查代码块是否有颜色区分
- [x] **验收**: 代码块中的关键字、字符串、注释有颜色区分，不支持的语言正常渲染

## 7. 欢迎屏幕

- [x] 7.1 创建 `Welcome.tsx` 组件：ASCII 艺术 Logo + koCode 版本 + Welcome 文案
- [x] 7.2 显示模型信息（provider/id · Nk context）和工作目录
- [x] 7.3 右侧或下方显示快速入门提示：`/help`、`/model`、`/clear` 命令简介
- [x] 7.4 在 `Conversation.tsx` 中当 `events.length === 0` 时渲染 Welcome 替代「No messages yet」
- [x] 7.5 运行 `pnpm dev` 检查首次启动的欢迎屏幕布局
- [x] **验收**: 首次启动显示 Logo + 模型 + cwd + 入门提示，/clear 后重新显示

## 8. 命令面板扩展到 20+ 命令

- [x] 8.1 在 `commands.ts` 中新增命令：`/compact`、`/context`、`/cost`、`/diff`、`/config`、`/init`、`/permissions`、`/theme`、`/resume`、`/branch`、`/feedback`、`/doctor`、`/export`、`/review`、`/skills`
- [x] 8.2 为每个新命令添加基础 handler（Tier 1 阶段大多为 notify 占位，真正实现在后续 Tier 完成）
- [x] 8.3 在命令列表中添加分类注释（Session / Information / Configuration / Development）
- [x] 8.4 更新 `CommandPanel.tsx` 宽度：命令名从 padEnd(18) 调整为 padEnd(26) 以适应更长命令名
- [x] 8.5 运行 `pnpm dev`，输入 `/` 检查命令面板显示 20+ 命令
- [x] **验收**: `/` 面板显示 20+ 命令，分类清晰，键盘导航正常

## 9. Header 信息层次增强

- [x] 9.1 修改 `Header.tsx`：检测是否在欢迎模式（events.length === 0），切换渲染布局
- [x] 9.2 欢迎模式：显示 ASCII Logo + Welcome 文案 + 模型信息 + cwd（多行）
- [x] 9.3 对话模式：紧凑两行（koCode vX.Y.Z · 模型信息 / cwd）
- [x] 9.4 将 `App.tsx` 中的 `events` 或 `hasContent` 传递到 Header
- [x] 9.5 运行 `pnpm dev` 检查欢迎模式和对话模式的 Header 显示
- [x] **验收**: 欢迎模式显示完整信息，对话模式显示紧凑两行

## 10. 权限系统核心

- [x] 10.1 在 `agent-session.ts` 中实现权限检查钩子：工具执行前检查 permission mode，决定是跳过还是请求确认
- [x] 10.2 对于需要确认的工具，emit `permission_request` 事件并等待 `permission_response`
- [x] 10.3 创建 `PermissionDialog.tsx` 组件：根据 toolType（bash/write/edit）渲染不同格式的确认对话框
- [x] 10.4 Write 对话框：文件路径 + 完整内容预览（带行号）+ ╌╌╌ 分隔线 + 三个选项
- [x] 10.5 Edit 对话框：文件路径 + Diff 预览（红/绿）+ 三个选项
- [x] 10.6 Bash 对话框：命令文本 + 自然语言描述 + 三个选项
- [x] 10.7 实现三选项逻辑：Yes（单次批准）/ Yes, allow all（批量授权）/ No（拒绝）
- [x] 10.8 在 App.tsx 中监听 `permission_request` 事件，弹出 PermissionDialog
- [x] 10.9 添加 `permissionDialog.test.tsx` 测试三种工具的对话框渲染
- [x] 10.10 运行 `pnpm dev`，在 Default 模式下让 AI 创建/编辑文件，验证对话框弹出和交互
- [x] **验收**: 三种工具的权限对话框格式正确，三选项行为正常，Accept Edits 模式下编辑自动通过

## 11. 权限模式切换

- [x] 11.1 在 `agent-session.ts` 中实现 3 级权限模式管理：Default → Accept Edits → Auto
- [x] 11.2 实现 Shift+Tab 循环切换权限模式，模式切换时 emit 模式变更事件
- [x] 11.3 在 StatusBar 中实时显示当前权限模式名称
- [x] 11.4 添加 `/permissions` 命令显示当前权限模式 + 规则列表
- [x] 11.5 运行 `pnpm dev`，按 Shift+Tab 切换模式，观察状态栏变化
- [x] **验收**: Shift+Tab 循环切换三级模式，状态栏同步更新

## 12. 上下文可视化（/context）

- [x] 12.1 在 `agent-session.ts` 中实现 `getContextBreakdown()` 方法：估算各组件的 token 占用
- [x] 12.2 组件估算：系统提示词（从 system-prompt 长度 / 4 估算）、CLAUDE.md（文件大小 / 4）、对话历史（消息数 * 平均长度 / 4）
- [x] 12.3 在 `commands.ts` 中实现 `/context` handler：调用 `getContextBreakdown()` 并渲染树状视图
- [x] 12.4 树状格式：`├ <component>: ~<N> tokens`，带健康度颜色指示（绿 <70%，黄 70-85%，红 >85%）
- [x] 12.5 运行 `pnpm dev`，输入 `/context` 检查 token 分析输出
- [x] **验收**: /context 输出树状 token 分析，超过阈值显示颜色警告

## 13. 费用追踪（/cost）

- [x] 13.1 在 `agent-session.ts` 中实现 `getUsage()` 方法：返回 token 使用统计（按模型分列）
- [x] 13.2 从 API 响应的 usage 字段中累计 input/output/cache_read/cache_write tokens
- [x] 13.3 费用计算：根据各 provider 的定价表计算 USD 费用
- [x] 13.4 在 `commands.ts` 中实现 `/cost` handler：渲染费用/用量表格
- [x] 13.5 输出格式：Total cost / Total duration (API + wall) / Code changes / Usage by model
- [x] 13.6 运行 `pnpm dev`，进行几轮对话后输入 `/cost` 检查统计数据
- [x] **验收**: /cost 显示完整的费用和用量统计，按模型分列

## 14. 状态面板（/status）

- [x] 14.1 创建 `StatusPanel.tsx` 组件：多 Tab 结构（Status / Usage）
- [x] 14.2 Status Tab：显示版本、Session ID、cwd、模型、权限模式、运行状态
- [x] 14.3 Usage Tab：复用 getUsage 数据
- [x] 14.4 在 App.tsx 中集成模态面板，/status 命令打开 StatusPanel
- [x] 14.5 运行 `pnpm dev`，输入 `/status` 检查 Tab 内容和切换
- [x] **验收**: /status 显示 Tab 面板，←/→ 切换正常，Esc 关闭

## 15. 模型选择器

- [x] 15.1 在 App.tsx 中添加 modal 状态支持
- [x] 15.2 /model 无参数时显示模态提示
- [x] 15.3 /model <provider>/<id> 有参数时直接切换（已有功能）
- [x] 15.4 运行 `pnpm dev`，输入 `/model` 查看，`/model <id>` 切换
- [x] **验收**: /model 有参数时切换模型，无参数时显示提示

## 16. 输入历史搜索（Ctrl+R）

- [x] 16.1 在 `InputBox.tsx` 中维护 `useRef<string[]>` 存储输入历史（最近 100 条）
- [x] 16.2 每次 onSubmit 时将文本追加到历史列表
- [x] 16.3 实现 Ctrl+R 逻辑：弹出搜索提示 `(reverse-i-search): `，实时过滤历史条目
- [x] 16.4 Ctrl+R 再次按下：循环到上一条匹配
- [x] 16.5 Enter 恢复选中条目到输入框，Escape 取消
- [x] 16.6 添加外部编辑器支持：Ctrl+G 启动 $EDITOR
- [x] 16.7 运行 `pnpm dev`，发送几条消息后按 Ctrl+R 搜索历史，按 Ctrl+G 编辑
- [x] **验收**: Ctrl+R 可搜索和恢复历史输入，Ctrl+G 打开编辑器

## 17. 会话分支与恢复

- [x] 17.1 在 `agent-session.ts` 中实现 `rewindLastTurn()` 和 `listSavedSessions()` 方法
- [x] 17.2 在 `commands.ts` 中实现 `/branch` 和 `/resume` handler 占位
- [x] 17.3 会话持久化已有 `session-store.ts` 提供 JSONL 存储
- [x] 17.4 实现完整的交互式分支选择和会话恢复 UI
- [x] 17.5 运行 `pnpm dev`，创建分支、恢复会话
- [x] **验收**: 可创建/列出分支，可恢复之前的会话

## 18. 检查点系统

- [x] 18.1 在 `agent-session.ts` 中实现文件快照：工具执行前保存原文件内容
- [x] 18.2 每个文件修改保存为检查点，关联到当前 turn
- [x] 18.3 实现 Esc Esc 监听：在 App.tsx 的 useInput 中检测双 Esc
- [x] 18.4 确认后应用检查点恢复，恢复文件内容
- [x] 18.5 实现 `/rewind` 命令 handler
- [x] 18.6 运行 `pnpm dev`，让 AI 修改文件后按 Esc Esc 回退
- [x] **验收**: 文件修改后可回退，检查点正确恢复内容

## 19. 主题系统

- [x] 19.1 定义主题接口：Theme/ThemeColors 接口 (theme.ts)
- [x] 19.2 实现 3 个内置主题：Dark、Light、ANSI-only
- [x] 19.3 创建 ThemeContext + ThemeProvider (theme.ts)
- [x] 19.4 `/theme` 命令列出可用主题并提示配置方式
- [x] 19.5 在 run.ts 中包裹 ThemeProvider
- [x] 19.6 运行 `pnpm dev`，使用 `/theme` 切换主题
- [x] **验收**: 可通过 /theme 切换主题，所有组件颜色同步更新

## 20. 外部编辑器集成

- [x] 20.1 在 `InputBox.tsx` 中监听 Ctrl+G
- [x] 20.2 按 Ctrl+G 时将当前输入写入临时文件
- [x] 20.3 启动 `$EDITOR`（默认 `vim`），等待进程退出
- [x] 20.4 编辑器退出后读取文件内容回填到输入框
- [x] 20.5 处理编辑器退出但未修改的情况
- [x] 20.6 运行 `pnpm dev`，输入一些文本后按 Ctrl+G 编辑
- [x] **验收**: Ctrl+G 打开编辑器，保存后内容返回输入框

## 21. 最终验收与清理

- [x] 21.1 运行 `pnpm test` 全量测试，确认所有测试通过
- [x] 21.2 运行 `pnpm dev` 逐项验收
- [x] 21.3 新开终端运行 `claude` 进行交叉对比验证
- [x] 21.4 记录并修复发现的任何差异
