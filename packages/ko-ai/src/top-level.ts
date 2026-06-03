import type { ApiType, Context, Model, SimpleStreamOptions, StreamOptions } from "./types.js";
import { getProvider } from "./provider-registry.js";
import type { AssistantMessage } from "./types.js";
import type { AssistantMessageEventStream } from "./stream.js";

// ============================================================================
// Top-level call helpers — the only functions external consumers should use
// ============================================================================

// ── API key resolution ──────────────────────────────────────────────────────

function hasApiKey(options: StreamOptions | undefined): boolean {
  return typeof options?.apiKey === "string" && options.apiKey.trim().length > 0;
}

function envApiKey(model: Model): string | undefined {
  // Provider-specific env vars
  const keyMap: Record<string, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  };
  return keyMap[model.provider] ?? process.env.KOCODE_API_KEY;
}

function injectApiKey<T extends StreamOptions>(
  model: Model,
  options: T | undefined,
): T | undefined {
  if (hasApiKey(options)) return options;
  const apiKey = envApiKey(model);
  if (!apiKey) return options;
  return { ...(options ?? {} as T), apiKey };
}

// ── stream() / complete() — tool-enabled ─────────────────────────────────────

export function stream(
  model: Model,
  context: Context,
  options?: StreamOptions,
): AssistantMessageEventStream {
  const provider = getProvider(model.api);
  return provider.stream(model, context, injectApiKey(model, options));
}

export async function complete(
  model: Model,
  context: Context,
  options?: StreamOptions,
): Promise<AssistantMessage> {
  const s = stream(model, context, options);
  return s.result();
}

// ── streamSimple() / completeSimple() — no tools ─────────────────────────────

export function streamSimple(
  model: Model,
  context: Context,
  options?: SimpleStreamOptions,
): AssistantMessageEventStream {
  const provider = getProvider(model.api);
  return provider.streamSimple(model, context, injectApiKey(model, options));
}

export async function completeSimple(
  model: Model,
  context: Context,
  options?: SimpleStreamOptions,
): Promise<AssistantMessage> {
  const s = streamSimple(model, context, options);
  return s.result();
}
