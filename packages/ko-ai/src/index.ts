// @kocode/ko-ai — Unified multi-provider LLM API layer

// Auto-register built-in providers
import "./providers/index.js";

// Core types
export type {
  ApiType,
  AssistantMessage,
  Context,
  ImageContent,
  Message,
  Model,
  ModelCost,
  SimpleStreamOptions,
  StopReason,
  StreamOptions,
  TextContent,
  ThinkingContent,
  ThinkingLevel,
  ThinkingLevelMap,
  Tool,
  ToolCall,
  ToolResultMessage,
  Usage,
  UserMessage,
} from "./types.js";

export { calculateCost } from "./types.js";

// Events
export type { AssistantMessageEvent } from "./events.js";

// Stream
export { AssistantMessageEventStream } from "./stream.js";

// Provider registry
export {
  clearProviders,
  createLazySimpleStream,
  createLazyStream,
  getProvider,
  getRegisteredApis,
  registerProvider,
  unregisterProviders,
} from "./provider-registry.js";

export type { ApiProvider, SimpleStreamFunction, StreamFunction } from "./provider-registry.js";

// Compatibility
export type { AnthropicMessagesCompat, OpenAICompletionsCompat } from "./compat.js";

// Top-level call helpers
export { complete, completeSimple, stream, streamSimple } from "./top-level.js";

// Models
export { getModel, getModels, getProviders, modelsAreEqual } from "./models.js";
export { getEnvApiKey } from "./env-api-keys.js";
