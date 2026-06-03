// ============================================================================
// Built-in model catalogue.
// Model structures: id, name, api, provider, baseUrl, reasoning, input, cost, contextWindow, maxTokens.
// Costs in USD per million tokens.
// ============================================================================

export const MODELS: Record<string, Record<string, any>> = {
  anthropic: {
    "claude-sonnet-4-5-20250514": {
      id: "claude-sonnet-4-5-20250514",
      name: "Claude Sonnet 4.5",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
      contextWindow: 200000,
      maxTokens: 8192,
    },
    "claude-opus-4-7-20250805": {
      id: "claude-opus-4-7-20250805",
      name: "Claude Opus 4.7",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
      contextWindow: 200000,
      maxTokens: 8192,
    },
    "claude-haiku-4-5-20251001": {
      id: "claude-haiku-4-5-20251001",
      name: "Claude Haiku 4.5",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
      contextWindow: 200000,
      maxTokens: 8192,
    },
  },

  openai: {
    "gpt-5.1": {
      id: "gpt-5.1",
      name: "GPT-5.1",
      api: "openai-completions",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 10 },
      contextWindow: 272000,
      maxTokens: 128000,
    },
    "gpt-5.1-mini": {
      id: "gpt-5.1-mini",
      name: "GPT-5.1 Mini",
      api: "openai-completions",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 2 },
      contextWindow: 272000,
      maxTokens: 128000,
    },
  },

  deepseek: {
    "deepseek-v3.1": {
      id: "deepseek-v3.1",
      name: "DeepSeek V3.1",
      api: "openai-completions",
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com/v1",
      reasoning: false,
      input: ["text"],
      cost: { input: 0.27, output: 1.1, cacheRead: 0.05, cacheWrite: 0.27 },
      contextWindow: 131072,
      maxTokens: 8192,
    },
  },

  google: {
    "gemini-2.5-pro": {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 1.25, output: 10, cacheRead: 0.25, cacheWrite: 1.25 },
      contextWindow: 1048576,
      maxTokens: 65536,
    },
    "gemini-2.5-flash": {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 0.15, output: 0.6, cacheRead: 0.03, cacheWrite: 0.15 },
      contextWindow: 1048576,
      maxTokens: 65536,
    },
  },
};
