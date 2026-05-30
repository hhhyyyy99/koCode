## Architecture Overview

koCode is a TypeScript Monorepo CLI coding assistant that replicates Claude Code's Agent + TUI experience while supporting multiple LLM Providers (Anthropic, OpenAI, Google Gemini, etc.), inspired by pi's multi-provider abstraction.

```
┌─────────────────────────────────────────────────────┐
│  ko-cli (CLI 入口)                                   │
│  解析参数 → 加载配置 → 创建 AgentSession → 启动 TUI  │
├─────────────────────────────────────────────────────┤
│  ko-tui (TUI 层, Ink/React)                          │
│  订阅 AgentSession 事件 → 渲染 UI → 收集用户输入     │
├─────────────────────────────────────────────────────┤
│  ko-agent (Agent 核心)                                │
│  Agent 循环 → Tool 执行 → 消息压缩 → 会话持久化       │
├─────────────────────────────────────────────────────┤
│  ko-ai (多 Provider API 层)                           │
│  统一接口 → Provider 注册表 → 流式响应 → Tool Use 转换 │
└─────────────────────────────────────────────────────┘
```

## Monorepo 包结构

```
koCode/
├── packages/
│   ├── ko-ai/          ← 多 Provider API 层
│   ├── ko-agent/       ← Agent 运行时
│   ├── ko-tui/         ← TUI (Ink/React)
│   └── ko-cli/         ← CLI 入口
├── package.json        ← pnpm workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 数据流

```
用户输入 → CLI 解析 → AgentSession.prompt()
                              │
                              ▼
                    ┌── Agent 循环 ──────────┐
                    │ 构建 Context            │
                    │  (system prompt +       │
                    │   messages + tools)     │
                    │         │               │
                    │         ▼               │
                    │ 调用 stream()           │
                    │  (ko-ai Tool-enabled入口)│
                    │         │               │
                    │         ▼               │
                    │ Provider 解析响应        │
                    │  (text / thinking /     │
                    │   tool_call)            │
                    │         │               │
                    │         ▼               │
                    │ 如果有 tool_call →      │
                    │   执行工具 → 循环继续    │
                    │ 如果 stop → 结束        │
                    └────────────────────────┘
                              │
                              ▼
                    TUI 通过事件流实时渲染
```

## ko-ai 多 Provider 设计

参考 pi-ai 的三层抽象：API 协议层 → Provider 注册表 → Model 定义。

### API 协议类型

| 协议 | 典型 Provider | 特点 |
|------|--------------|------|
| `anthropic-messages` | Anthropic, Fireworks | 原生 Tool Use, Thinking |
| `openai-completions` | OpenAI, DeepSeek, Groq, Together, OpenRouter | function_call 格式 |
| `google-generative-ai` | Google Gemini | 自有 Tool 格式 |

### Model 接口

```typescript
interface Model {
  id: string;              // "claude-sonnet-4-5-20250514"
  api: ApiType;            // "anthropic-messages" | "openai-completions" | ...
  provider: string;        // "anthropic" | "openai" | ...
  baseUrl: string;         // 实际请求地址
  reasoning: boolean;      // 是否支持 thinking
  cost: { input, output, cacheRead, cacheWrite };
  contextWindow: number;
  maxTokens: number;
  headers?: Record<string, string>;
  compat?: OpenAICompat | AnthropicCompat;  // 协议兼容性覆写
}
```

### Provider 注册模式

```typescript
// 全局注册表，懒加载 provider 模块
registerProvider({
  api: "anthropic-messages",
  stream: createLazyStream(() => import("./providers/anthropic")),
  streamSimple: createLazySimpleStream(() => import("./providers/anthropic")),
});
```

### 兼容性配置 (compat)

OpenAI 兼容 provider 的差异通过 compat 对象覆盖：

```typescript
interface OpenAICompat {
  supportsStore?: boolean;
  supportsReasoningEffort?: boolean;
  maxTokensField?: "max_completion_tokens" | "max_tokens";
  thinkingFormat?: "openai" | "openrouter" | "deepseek" | ...;
  cacheControlFormat?: "anthropic";
  // ...
}
```

## ko-agent Agent 核心

### Agent 循环

```
while (true) {
  1. 构建 Context (systemPrompt + messages + tools)
  2. 调用 ko-ai 的 stream() 获取 Tool-enabled 流式响应
  3. 流式处理响应事件:
     - text_delta → 累积文本
     - thinking_delta → 累积思考
     - toolcall_end → 解析参数, 执行工具
  4. 收集完整 AssistantMessage
  5. 如果有 toolCall → 执行工具, 追加 ToolResultMessage, 继续循环
  6. 如果 stopReason === "stop" → 结束循环
  7. 检查是否需要压缩 (token 阈值)
}
```

### 事件总线

Agent 通过事件向外广播状态变化，TUI 是消费者：

```typescript
type AgentEvent =
  | { type: "turn_start" }
  | { type: "message_start"; index: number }
  | { type: "message_delta"; content: string }
  | { type: "thinking_start" }
  | { type: "thinking_delta"; content: string }
  | { type: "tool_start"; toolCall: ToolCall }
  | { type: "tool_end"; toolCallId: string; result: ToolResult }
  | { type: "turn_end"; usage: Usage }
  | { type: "compaction_start" }
  | { type: "compaction_end"; result: CompactionResult }
```

### Tool 系统

参考 Claude Code 的工具定义，每个工具包含 definition + execute：

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
}

interface ToolExecutor {
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}
```

内置工具: Read, Edit, Bash, Write, Grep, Find, Ls

### 会话持久化

使用 JSONL 文件存储对话历史：
- `~/.kocode/sessions/<session-id>.jsonl`
- 每行一个 Message JSON
- 支持 session 切换和恢复

### 消息压缩

当 context 接近模型窗口上限时触发压缩：
- 保留 system prompt + 最近消息
- 中间消息用摘要替代
- 阈值可配置（默认 80%）

## ko-tui TUI 层

使用 Ink (React for CLI)，参考 Claude Code 的交互方式。

### 事件处理

TUI 订阅 AgentSession 的事件总线，统一入口 onEvent：

```typescript
class KoCodeTUI {
  onEvent(event: AgentEvent) {
    switch (event.type) {
      case "thinking_delta":  this.appendThinking(event.content); break;
      case "message_delta":   this.appendMessage(event.content); break;
      case "tool_start":      this.showToolExecution(event.toolCall); break;
      case "tool_end":        this.foldToolResult(event.result); break;
      case "turn_end":        this.showUsage(event.usage); break;
    }
  }
}
```

### UI 组件

基于 Ink 组件化开发：
- `App` — 根组件，管理状态
- `UserMessage` — 用户输入显示
- `AssistantMessage` — AI 回复 (Markdown 渲染)
- `ThinkingBlock` — 思考过程展示
- `ToolExecution` — 工具执行状态 (展开/折叠)
- `Input` — 用户输入编辑器
- `StatusBar` — 模型/token/会话信息
- `ModelSelector` — Provider/模型选择器

### 主题系统

JSON 主题文件定义颜色方案，支持 dark/light。

## ko-cli CLI 入口

### 命令行参数

```bash
kocode [options] [message]
  --provider <name>     指定 provider
  --model <id>          指定模型
  --config <path>       配置文件路径
  --session <id>        恢复会话
  --print               非交互模式
```

### 配置文件

`~/.kocode/config.yaml`:

```yaml
providers:
  anthropic:
    apiKey: "sk-..."
    baseUrl: "https://api.anthropic.com"
  openai:
    apiKey: "sk-..."
    baseUrl: "https://api.openai.com/v1"
  deepseek:
    apiKey: "sk-..."
    baseUrl: "https://api.deepseek.com"

default:
  provider: "anthropic"
  model: "claude-sonnet-4-5-20250514"
```

## Technical Decisions

| 决策 | 选择 | 原因 |
|------|------|------|
| Monorepo 管理 | pnpm workspace | 轻量，原生支持 workspace |
| TUI 框架 | Ink (React) | 成熟生态，Claude Code 同方案 |
| Provider SDK | 各 Provider 原生 SDK | pi 的做法，兼容性最好 |
| Tool Schema | JSON Schema | Claude Code 标准，不引入额外依赖 |
| 会话存储 | JSONL 文件 | pi 和 Claude Code 都用这个方案 |
| 消息压缩 | 基于 token 阈值的摘要替换 | pi 和 Claude Code 的做法 |
| 包管理器 | pnpm | 快速，磁盘效率高 |
