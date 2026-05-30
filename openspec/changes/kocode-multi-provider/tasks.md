## 0. OpenSpec artifacts 验收

- [x] 0.1 将所有 capability spec 改为 OpenSpec delta 格式（`## ADDED Requirements`）
- [x] 0.2 为每个 requirement 补充至少一个 `#### Scenario:`
- [x] 0.3 运行 `openspec validate kocode-multi-provider --strict` 并修复所有错误
- [x] 0.4 对照 proposal/design/specs 复核 tasks 覆盖所有 MUST/SHOULD 决策

## 1. 项目初始化

- [x] 1.1 初始化 pnpm monorepo（package.json、pnpm-workspace.yaml、tsconfig.base.json）
- [x] 1.2 创建 4 个包目录结构（ko-ai、ko-agent、ko-tui、ko-cli）及各自的 package.json
- [x] 1.3 配置 TypeScript（tsconfig.json 继承 base，各包配置 paths 和 references）
- [x] 1.4 安装核心依赖（@anthropic-ai/sdk、openai、@google/generative-ai、ink、react）
- [x] 1.5 配置基础质量命令（typecheck、test、build、lint 如适用）

## 2. ko-ai 多 Provider API 层

- [ ] 2.1 定义核心类型（Model、Context、Message、Tool、Usage、StopReason）
- [ ] 2.2 定义流式事件协议类型（AssistantMessageEvent union type）
- [ ] 2.3 实现 AssistantMessageEventStream（push/end/result + AsyncIterable）
- [ ] 2.4 实现 Provider 注册表（registerProvider、getProvider、懒加载包装）
- [ ] 2.5 实现 Anthropic Messages Provider（流式响应、Tool Use、Thinking）
- [ ] 2.6 实现 OpenAI Completions Provider（流式响应、function_call、reasoning）
- [ ] 2.7 实现 Google Gemini Provider（流式响应、functionCall）
- [ ] 2.8 定义 OpenAICompat / AnthropicCompat 兼容性接口
- [ ] 2.9 实现顶层调用入口（stream、complete、streamSimple、completeSimple）
- [ ] 2.10 实现环境变量自动注入 API Key
- [ ] 2.11 编写 models.ts + models.generated.ts 内置模型数据
- [ ] 2.12 实现 OpenAI 兼容 Provider 默认值推断（DeepSeek、Groq、Together、OpenRouter 等）
- [ ] 2.13 补充 ko-ai 单元测试（事件流、Provider 注册、compat、API key 注入）

## 3. ko-agent Agent 核心

- [ ] 3.1 定义 Agent 接口和基于 `stream()` 的 Tool-enabled Agent 循环核心逻辑
- [ ] 3.2 实现事件总线（addEventListener、emit）
- [ ] 3.3 实现 AgentSession 类（prompt、cancel、状态管理）
- [ ] 3.4 实现 JSONL 会话存储（写入、读取、会话恢复）
- [ ] 3.5 实现系统提示词生成（扫描 CLAUDE.md / .kocode/context.md、注入项目信息、工具说明、当前日期）
- [ ] 3.6 实现消息压缩检测（token 阈值计算）
- [ ] 3.7 实现消息压缩执行（摘要替换中间消息）
- [ ] 3.8 实现自动重试机制（可重试错误的退避重试）
- [ ] 3.9 实现最大循环次数限制（默认 100 轮）
- [ ] 3.10 在每轮循环和工具执行前检查 abort signal
- [ ] 3.11 定义完整 AgentSessionEvent 类型（turn/message/thinking/tool/compaction/model_changed/cancelled/error）
- [ ] 3.12 实现 context overflow 自动压缩触发
- [ ] 3.13 实现压缩阈值配置和手动压缩入口
- [ ] 3.14 补充 Agent 单元测试（tool loop、cancel、retry、compaction、JSONL restore）

## 4. Tool 系统

- [ ] 4.1 定义 ToolDefinition 和 ToolExecutor 接口
- [ ] 4.2 实现工具注册表（registerTool、getTools、转换为 Provider 格式）
- [ ] 4.3 实现 Read 工具（读取文件、行号范围）
- [ ] 4.4 实现 Edit 工具（文本替换、diff 生成）
- [ ] 4.5 实现 Write 工具（创建/覆盖文件）
- [ ] 4.6 实现 Bash 工具（shell 执行、超时控制）
- [ ] 4.7 实现 Grep 工具（文本搜索）
- [ ] 4.8 实现 Find 工具（文件查找）
- [ ] 4.9 实现 Ls 工具（目录列表）
- [ ] 4.10 实现路径沙箱（cwd 限制）
- [ ] 4.11 实现跨 Provider Tool Use 格式转换
- [ ] 4.12 实现工具参数 JSON Schema 校验
- [ ] 4.13 实现 Bash 命令白名单/黑名单配置
- [ ] 4.14 实现危险操作权限确认机制
- [ ] 4.15 补充 Tool 单元测试（path traversal、Edit 唯一匹配、Write diff、Bash policy、Provider 转换）

## 5. ko-tui TUI 层

- [ ] 5.1 初始化 Ink 项目结构，搭建 App 根组件
- [ ] 5.2 实现 onEvent 统一事件分发
- [ ] 5.3 实现 UserMessage 组件
- [ ] 5.4 实现 AssistantMessage 组件（Markdown 渲染）
- [ ] 5.5 实现 ThinkingBlock 组件（可折叠）
- [ ] 5.6 实现 ToolExecution 组件（展开/折叠、diff 渲染）
- [ ] 5.7 实现 Input 组件（多行输入、快捷键、历史浏览）
- [ ] 5.8 实现 StatusBar 组件（模型、token、会话信息）
- [ ] 5.9 实现斜杠命令解析和处理
- [ ] 5.10 实现主题系统（dark/light）
- [ ] 5.11 实现 Ctrl+C 中断处理
- [ ] 5.12 实现 ModelSelector 组件（Provider/模型选择器）
- [ ] 5.13 实现 Tab 自动补全（命令/模型/会话如适用）
- [ ] 5.14 实现自定义主题 JSON 加载和校验
- [ ] 5.15 补充 TUI 组件测试或最小交互测试（事件渲染、输入历史、Ctrl+C、斜杠命令）

## 6. ko-cli CLI 入口

- [ ] 6.1 实现命令行参数解析（--provider、--model、--config、--session、--print）
- [ ] 6.2 实现配置文件读写（~/.kocode/config.yaml）
- [ ] 6.3 实现 Provider 配置解析（从配置构建 Model 列表）
- [ ] 6.4 实现环境变量覆盖（KOCODE_API_KEY、ANTHROPIC_API_KEY 等）
- [ ] 6.5 实现会话管理命令（list、delete、resume）
- [ ] 6.6 实现主启动流程（加载配置 → 创建 AgentSession → 启动 TUI）
- [ ] 6.7 实现非交互模式（--print）
- [ ] 6.8 实现管道输入模式（`echo "msg" | kocode`）
- [ ] 6.9 实现 --help 和 --version
- [ ] 6.10 实现项目级配置 `.kocode/config.yaml` 及配置优先级
- [ ] 6.11 实现自定义模型定义解析
- [ ] 6.12 实现会话重命名命令（如保留 SHOULD）
- [ ] 6.13 补充 CLI 测试（参数覆盖、配置优先级、stdin、--print、sessions 命令）

## 7. 集成与测试

- [ ] 7.1 端到端集成：CLI → Agent → ko-ai → TUI 全流程打通
- [ ] 7.2 多 Provider 切换测试（Anthropic、OpenAI、DeepSeek）
- [ ] 7.3 Tool 执行测试（Read/Edit/Bash 跨 Provider 兼容）
- [ ] 7.4 会话持久化和恢复测试
- [ ] 7.5 消息压缩功能测试
- [ ] 7.6 运行 `pnpm typecheck`
- [ ] 7.7 运行 `pnpm test`
- [ ] 7.8 运行 `pnpm build`
- [ ] 7.9 验证非交互模式、管道输入、会话恢复的端到端行为
