## Context

当前 TUI 基于 `kocode-tui-rewrite` 变更的产物——Ink 5 + React 18，Turn 分组架构（`useTurns` hook），组件化对话渲染（UserBubble / AssistantBlock / ToolCallCard / ThinkingBlock / CommandPanel / InputBox / Header）。`kocode-tui-rewrite` 解决了架构问题（平铺→分组）和数据正确性问题（文本去重、thinking 位置、textIndex bug），但视觉呈现与 Claude Code v2.1.143 仍有明显差距。

本次设计在现有架构上增量增强，分三个 Tier 逐步对齐，每个 Tier 包含可独立测试验收的里程碑。

## Goals / Non-Goals

**Goals:**
- Tier 1: 视觉符号、格式、动画完全对齐 Claude Code（工具卡片、回合标记、输入前缀、状态栏、语法高亮、欢迎屏）
- Tier 2: 核心功能对齐（权限系统、/context、/cost、/status 面板、模型选择器、历史搜索）
- Tier 3: 高级功能对齐（会话分支、检查点、主题、外部编辑器、MCP 管理）
- 每个 Tier 内的里程碑独立可测试，有明确的验收标准
- 保持现有 Turn 分组架构不变，增量增强而非重写

**Non-Goals:**
- 不替换 Ink 5 + React 18 框架
- 不实现 MCP 服务器运行时（MCP 管理界面只做展示/配置）
- 不支持多会话并行显示
- 不实现 IME composition 状态追踪（中文输入法的 `/` 问题 — Tier 1 之后评估）
- 不修改 AI/Provider 层（ko-ai 包）

## Decisions

### D0: 先修交互完整性，再追功能对齐

**选择**: 在继续 Tier 1/2/3 功能对齐前，增加 Phase 0，专门修正输入控制权、焦点模型、工具卡片展开、权限 modal、真实 TTY 验收这些交互完整性问题。

**理由**: 当前很多任务已经勾选“代码完成”，但未经过 `pnpm dev` 真实交互验收。TUI 的质量不取决于组件是否存在，而取决于连续会话中用户是否始终知道：我能输入什么、当前焦点在哪里、Agent 在做什么、这个权限请求会产生什么后果、如何展开查看细节。若这些主循环不稳定，继续添加 `/branch`、主题、MCP、模型选择器等功能只会扩大体验债务。

**验收含义**: Phase 0 通过前，任何“视觉对齐”或“功能对齐”任务都不能仅凭单元测试或静态截图标记为验收完成；必须在真实 TTY 中完成交互路径验证。

### D1: 增量增强 vs 二次重写

**选择**: 在 `kocode-tui-rewrite` 产物上增量增强，不从头重写。

**理由**: 当前架构已经正确——Turn 分组、mergeDelta 去重、事件驱动渲染都经过了 7 轮修复验证。重写意味着重新踩坑。增量增强可以精确定位每个视觉/功能差距。

**替代方案**: 重写所有组件。被否决——风险高，现有 52 个测试可以保护增量修改。

### D2: 工具卡片渲染策略

**选择**: 修改现有 `ToolCallCard.tsx`，将符号从 `⚙` 改为 `●`（黄色），标题从 `⚙ toolName (/path)` 改为 `ToolName(params)`，结果前缀加 `⎿`，为 Edit 工具渲染行号 diff。

**理由**: 组件已存在且功能正确（collapsible、status 状态），只需调整渲染输出。Claude Code 不使用 `⚙` 符号，统一用 `●` + 黄色表示进行中。

**替代方案**: 新建 `ClaudeToolCard.tsx` 并废弃旧组件。被否决——差异只是视觉层面，不需要两套组件。

### D3: 回合完成标记

**选择**: 在 `turn_end` 事件处理时，记录 `completedAt` 时间戳，在 Turn 数据模型中增加 `durationMs` 字段。渲染时显示 `✻ <动词> for <耗时>`。

**理由**: 这是 Claude Code 的标志性交互细节。趣味动词列表（Cooked/Baked/Crunched/Stewed）从文档第 2.3 节提取。

**替代方案**: 简单的 `✓ Done (Xs)`。被否决——缺少趣味性，与 Claude Code 不一致。

### D4: 输入前缀系统架构

**选择**: 在 `InputBox` 的 `onSubmit` 中解析前缀（`!`/`#`/`@`/`/`），根据前缀类型路由到不同处理逻辑。`!` 直接执行 Shell（通过 session 暴露的 exec 方法），`#` 写入 CLAUDE.md，`@` 基础文件引用（Tier 1 不做自动补全）。

**理由**: 前缀系统是 Claude Code 输入体验的核心，但补全引擎（`@` 的文件/目录补全）复杂度高。Tier 1 先做前缀解析和路由，Tier 2 再加补全。

**替代方案**: 在 Agent 层实现前缀解析。被否决——前缀行为是终端交互层关注点，Agent 应保持通用。

### D5: 权限系统架构

**选择**: Agent 层新增 `permission_request` 事件（含 requestId、toolType、params、description），TUI 层渲染 PermissionDialog（文件预览/diff 预览/Bash 确认），用户选择后 emit `permission_response` 事件。权限模式（Default/Accept Edits/Auto）在 session 级别管理，Accept Edits 下编辑类工具自动批准。

**理由**: 权限系统需要 Agent 和 TUI 协作——Agent 在执行前暂停等待确认，TUI 展示信息让用户决策。事件驱动架构天然支持这种双向通信。

**替代方案**: 在 Agent 层同步调用 TUI 回调。被否决——同步阻塞会冻结整个事件循环。

### D6: 代码块语法高亮

**选择**: 自行实现轻量 tokenizer（~200 行），不引入 highlight.js / prism 等依赖。基于正则匹配区分关键字、字符串、注释、数字、标点。

**理由**: koCode 需要在终端中保持零外部依赖启动。highlight.js 会增加 ~500KB 安装体积，且大部分语言支持用不到。自实现 tokenizer 覆盖 Python/TS/JS/Go/Rust/Bash 6 种语言的常见关键字即可。

**替代方案**: 引入 `ink-syntax-highlight` 或 `cli-highlight`。被否决——增加依赖，且 Claude Code 本身也未使用完整语法高亮库（使用 Monokai Extended 主题但只在代码块中做基础着色）。

### D7: 欢迎屏幕

**选择**: 新建 `Welcome.tsx` 组件，在 `events.length === 0` 时渲染（替代当前的「No messages yet」）。左侧：ASCII Logo + koCode 版本 + 模型信息 + cwd。右侧：Tips for getting started（/help、/model 等）。

**理由**: Claude Code 的欢迎屏幕提供两个信息层次——左侧品牌和状态，右侧操作引导。这是用户首次启动时的第一印象。

**替代方案**: 简单的欢迎文字。被否决——与 Claude Code 体验不一致。

### D8: 分层测试策略

**选择**: 每个 Tier/里程碑完成后跑以下测试：
1. `vitest` 单元测试（mergeDelta、processEvent、tokenizer、前缀解析）
2. `script/verify-render.ts` 伪 TTY 截图验证（初始布局、命令面板、工具卡片）
3. `pnpm dev` 手动交互验证（发消息不重复、thinking 在上方、工具卡片格式、回合标记）

**理由**: 用户明确要求「每一个小里程碑都需要有一次测试验收」。伪 TTY 截图可以自动验证渲染输出，但不能验证交互流——需要人工交叉对比 Claude Code。

## Risks / Trade-offs

- **[Risk] 功能清单推进掩盖交互主循环失败** → 新增 Phase 0 作为验收门槛：输入、焦点、工具展开、权限 modal、状态恢复必须先通过真实 TTY 验收
- **[Risk] 三个 Tier 范围过大，可能中途疲劳** → 每个 Tier 拆成 2-4 个小里程碑，每个里程碑 1-3 小时可完成，完成后立即验收，保持动力
- **[Risk] 语法高亮正则方案在某些边缘情况着色错误** → 先覆盖 6 种主流语言，遇到不支持的语言 fallback 到无高亮渲染，不丢内容
- **[Risk] 权限系统引入 Agent-TUI 双向通信，事件类型增加** → 用好现有事件驱动架构，新增事件类型严格遵循现有 `AgentSessionEvent` 联合类型风格
- **[Risk] 大量 spec 文件（16 个）可能过度规格化** → 每个 spec 聚焦验收场景（1-3 个 Scenario），避免过度描述实现细节
- **[Trade-off] 输入前缀中的 `#` 记忆功能** → Claude Code 写入 CLAUDE.md，koCode 可以写入项目级 `CLAUDE.md`。但如果项目没有该文件，需要首次创建。这个交互在 Tier 1 做简化版本

## Migration Plan

1. 每次里程碑结束后 `pnpm dev` 交叉验证 Claude Code（新终端中运行 `claude`）
2. 所有现有测试（52 个）持续通过，新增测试随新功能添加
3. 不变更 ko-ai / ko-cli 包，只修改 ko-tui 和 ko-agent（事件类型）
4. 回退策略：每个 Tier 用 git commit 隔离，有问题可以 revert Tier 级别

## Open Questions

- **Q1: 中文输入法下的 `/` 触发问题** — 中文输入法使用 `/` 键，输入拼音时可能误触发命令面板。Claude Code 如何处理的？需要进一步研究（compositionstart/compositionend 在 Ink 中是否可用？）
- **Q2: `@` 文件补全的补全源** — 从文件系统 glob？还是从 git ls-files？Claude Code 的 `@` 补全支持 .gitignore 过滤，需要配置开关
- **Q3: Tier 3 的高级功能** — 会话分支、检查点需要文件快照基础设施，是否在 koCode 的 MVP 范围内？可在 Tier 2 完成后重新评估
