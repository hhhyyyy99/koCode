## Why

需要一个 CLI 编码助手工具（koCode），它是 Claude Code 的复刻版本，但核心差异在于支持自定义 Provider（不仅限于 Anthropic，还支持 OpenAI、Google Gemini 等），参考 pi 项目的多 Provider 抽象设计。

## What Changes

- 基于 TypeScript 构建 Monorepo 项目，包含 4 个包
- 实现统一的多 Provider LLM API 层（参考 pi-ai），支持 Anthropic、OpenAI、Google Gemini 等 Provider
- 实现 Agent 运行时核心（参考 pi-agent-core + Claude Code），包含 Agent 循环、消息管理、压缩、工具系统
- 实现 Claude Code 风格的 TUI（使用 Ink/React），包含流式输出、工具执行渲染、Markdown 渲染
- 实现 CLI 入口，包含配置管理、Provider 配置、会话管理
- 工具系统参考 Claude Code，包含 Read、Edit、Bash、Write、Grep、Find 等工具
- 跨 Provider 的 Tool Use 兼容层，统一 Anthropic 的 tool_use 和 OpenAI 的 function_call 格式

## Capabilities

### New Capabilities

- `multi-provider-api`: 统一的多 Provider LLM API 抽象层，支持 Anthropic/OpenAI/Google 等 provider，包含流式响应、Tool Use、Thinking 支持
- `agent-runtime`: Agent 运行时核心，包含 Agent 循环、会话管理、消息压缩、JSONL 持久化
- `tool-system`: 工具系统，包含 Read、Edit、Bash、Write、Grep、Find 等工具定义与执行
- `tui-interface`: 基于 Ink/React 的终端用户界面，参考 Claude Code 的交互方式
- `cli-entry`: CLI 入口与配置管理，包含 Provider 配置、模型选择、会话管理

### Modified Capabilities

（无，全新项目）

## Impact

- 技术栈：TypeScript + Node.js，pnpm monorepo
- 核心依赖：Ink（TUI）、@anthropic-ai/sdk、openai、@google/generative-ai（Provider SDKs）
- 目标平台：Node.js >= 20，终端环境
- 参考项目：pi（多 Provider 设计）、Claude Code（Agent 循环、工具系统、TUI 交互）
