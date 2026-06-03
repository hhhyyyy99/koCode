## Context

当前 TUI 基于 Ink 5 + React 18，包含 5 个组件（App、Conversation、InputBox、StatusBar、Markdown）。事件模型在 `ko-agent/src/events.ts` 定义了完整的 AgentSessionEvent 联合类型。上一个变更 `kocode-config-tui-enhance` 在现有架构上做了增量改进（Markdown 渲染、diff 预览、多行输入），但没有改变平铺式渲染架构。

本次设计从架构层重写，引入 Turn 分组模型、交互式命令面板、组件化对话渲染。

## Goals / Non-Goals

**Goals:**
- Turn 分组的对话渲染：用户消息 + 助手回复（文本/工具调用/thinking）归组显示
- 交互式命令面板：输入 `/` 弹出可过滤、可键盘导航的命令列表
- Header 品牌区：logo + 版本 + 模型 + 工作目录
- 工具调用卡片：折叠/展开，运行时 spinner，完成后状态标记
- 增强输入框：带边框、placeholder、快捷键提示
- 已完成轮次使用 `<Static>` 渲染以优化终端滚动
- 补充 `user_message` 事件使事件流完整

**Non-Goals:**
- 不替换底层框架（继续使用 Ink 5 + React 18）
- 不支持鼠标交互（终端限制）
- 不实现语法高亮（可后续迭代）
- 不修改 Provider/AI 层
- 不支持多会话并行显示

## Decisions

### D1: Turn 分组消费事件流

**选择**: 在 TUI 层用 `useTurns` hook 将 `AgentSessionEvent[]` 流转换为 `Turn[]` 列表，而非直接平铺渲染。

**理由**: 平铺渲染导致用户消息、助手文本、工具调用、thinking 混合在一起难以区分。Turn 分组让每个对话轮次有清晰的视觉边界。

**替代方案**: 在 Agent 层直接 emit Turn 对象。被否决——Agent 层应保持事件粒度的灵活性，分组是视图层的关注点。

### D2: 命令面板在输入框下方

**选择**: CommandPanel 渲染在 InputBox 下方（而非覆盖层或上方）。

**理由**: 匹配 Claude Code 的行为——用户输入 `/`，匹配的命令列表出现在输入行下方，如同自动补全下拉菜单。Ink 不支持 absolute positioning，所以插入式布局是唯一可靠的方式。

### D3: `<Static>` 用于已完成轮次

**选择**: 已完成的 Turn 使用 Ink 的 `<Static>` 组件渲染，当前正在流式输出的 Turn 使用普通 `<Box>`。

**理由**: `<Static>` 将内容一次性写入终端后不再参与 React re-render。这避免了大量旧消息在新事件到来时的无意义重渲染，同时内容保留在终端回滚缓冲区中，用户可向上滚动查看。这是 Claude Code 处理终端滚动的方式。

### D4: 事件模型补充而非重构

**选择**: 在现有 `AgentSessionEvent` 联合类型中新增 `user_message` 事件，不改变其他事件类型。

**理由**: 最小化 Agent 层改动。其他事件类型已经足够丰富（message_start/delta/end、tool_start/end、thinking_start/delta/end、compaction、error），只需补上用户消息事件即可让事件流覆盖完整会话。

### D5: 保留 Markdown 组件

**选择**: 保留现有的 `Markdown.tsx` 组件作为 `AssistantBlock` 的渲染内核，而非引入 ink-markdown 依赖。

**理由**: 现有 Markdown 组件已覆盖代码块、粗体、标题、列表，且不引入额外依赖。后续可按需增强。

## Risks / Trade-offs

- **[Risk] `<Static>` 内的 Turn 无法折叠/展开** → 已渲染到 `<Static>` 的内容是只读的。工具卡片的折叠/展开只在当前活跃 Turn 中可用。我们认为这是合理的——已完成轮次的折叠价值有限。
- **[Risk] 大量 Turn 后组件树膨胀** → `<Static>` 不会导致 re-render，但每次事件更新会触发 `useTurns` 重新计算 Turn 列表。缓解：useMemo 缓存已完成的 Turn。
- **[Risk] 命令面板过滤在中文输入法下可能触发** → 中文输入法通常使用 `/` 键，需要在 InputBox 中跟踪 IME composition 状态，compositionstart/compositionend 期间不触发命令面板。
- **[Trade-off] 放弃了增量改进路径** → 本次是全量重写，风险高于在现有组件上迭代。但现有代码量小（~300 行），且新架构的 Turn 分组与旧架构的平铺渲染互不兼容，增量改造成本反而更高。
