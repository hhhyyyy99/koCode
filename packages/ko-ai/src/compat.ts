// ============================================================================
// Compatibility settings for provider-specific protocol differences.
//
// Each provider adapter reads these optional overrides to decide how to format
// requests and parse responses for non-standard / compatible APIs.
// ============================================================================

/**
 * Compatibility settings for OpenAI Chat/Completions-compatible APIs.
 * Used to override URL-based auto-detection for custom providers
 * (DeepSeek, Groq, Together, OpenRouter, etc.).
 */
export interface OpenAICompletionsCompat {
  /** Send `store` field. */
  supportsStore?: boolean;
  /** Accept `developer` role in addition to `system`. */
  supportsDeveloperRole?: boolean;
  /** Send `reasoning_effort`. */
  supportsReasoningEffort?: boolean;
  /** Include `stream_options: { include_usage: true }` for usage in streams. */
  supportsUsageInStreaming?: boolean;
  /** Which field holds max tokens. "max_completion_tokens" or "max_tokens". */
  maxTokensField?: "max_completion_tokens" | "max_tokens";
  /** Tool results require a `name` field. */
  requiresToolResultName?: boolean;
  /** Needs an assistant message inserted after tool results before next user message. */
  requiresAssistantAfterToolResult?: boolean;
  /** Convert thinking blocks to text with `<thinking>` delimiters. */
  requiresThinkingAsText?: boolean;
  /** Include empty `reasoning_content` on replayed assistant messages when reasoning is on. */
  requiresReasoningContentOnAssistantMessages?: boolean;
  /**
   * Format for reasoning / thinking parameter.
   * - "openai": `reasoning_effort`
   * - "openrouter": `reasoning: { effort }`
   * - "deepseek": `thinking: { type }`
   * - "together": `reasoning: { enabled }`
   * - "string-thinking": `thinking: string`
   */
  thinkingFormat?:
    | "openai"
    | "openrouter"
    | "deepseek"
    | "together"
    | "qwen"
    | "qwen-chat-template"
    | "string-thinking";
  /** Whether the provider supports `strict` in tool definitions. */
  supportsStrictMode?: boolean;
  /**
   * Cache control convention for prompt caching.
   * "anthropic": apply Anthropic-style `cache_control` markers.
   */
  cacheControlFormat?: "anthropic";
  /** Whether to send session-affinity headers from `options.sessionId`. */
  sendSessionAffinityHeaders?: boolean;
  /** Whether the provider supports long cache retention. */
  supportsLongCacheRetention?: boolean;
}

/**
 * Compatibility settings for Anthropic Messages-compatible APIs.
 */
export interface AnthropicMessagesCompat {
  /** Whether the provider accepts per-tool `eager_input_streaming`. */
  supportsEagerToolInputStreaming?: boolean;
  /** Whether the provider supports long cache retention (`ttl: "1h"`). */
  supportsLongCacheRetention?: boolean;
  /** Send `x-session-affinity` header for prompt cache routing. */
  sendSessionAffinityHeaders?: boolean;
  /** Include `cache_control` on tool definitions. */
  supportsCacheControlOnTools?: boolean;
  /** Force adaptive thinking format regardless of model id. */
  forceAdaptiveThinking?: boolean;
  /** Replay empty thinking signatures as `signature: ""` instead of converting to text. */
  allowEmptySignature?: boolean;
}
