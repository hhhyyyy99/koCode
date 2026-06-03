import type {
  ApiType,
  AssistantMessage,
  Context,
  Model,
  SimpleStreamOptions,
  StreamOptions,
} from "./types.js";
import { AssistantMessageEventStream } from "./stream.js";

// ============================================================================
// Stream function signatures
// ============================================================================

export type StreamFunction = (
  model: Model,
  context: Context,
  options?: StreamOptions,
) => AssistantMessageEventStream;

export type SimpleStreamFunction = (
  model: Model,
  context: Context,
  options?: SimpleStreamOptions,
) => AssistantMessageEventStream;

// ============================================================================
// ApiProvider — what gets registered for each API protocol type
// ============================================================================

export interface ApiProvider {
  api: ApiType;
  stream: StreamFunction;
  streamSimple: SimpleStreamFunction;
}

// ============================================================================
// Global provider registry
// ============================================================================

interface RegisteredEntry {
  provider: ApiProvider;
  sourceId?: string;
}

const registry = new Map<ApiType, RegisteredEntry>();

export function registerProvider(provider: ApiProvider, sourceId?: string): void {
  registry.set(provider.api, { provider, sourceId });
}

export function getProvider(api: ApiType): ApiProvider {
  const entry = registry.get(api);
  if (!entry) {
    throw new Error(`No API provider registered for api: ${api}`);
  }
  return entry.provider;
}

export function getRegisteredApis(): ApiType[] {
  return Array.from(registry.keys());
}

export function unregisterProviders(sourceId: string): void {
  for (const [api, entry] of registry.entries()) {
    if (entry.sourceId === sourceId) {
      registry.delete(api);
    }
  }
}

export function clearProviders(): void {
  registry.clear();
}

// ============================================================================
// Lazy-loading builder — defers `import()` until the first call
// ============================================================================

export function createLazyStream(
  loader: () => Promise<{ stream: StreamFunction }>,
): StreamFunction {
  let cached: StreamFunction | undefined;
  return (model, context, options) => {
    if (cached) return cached(model, context, options);

    const stream = new AssistantMessageEventStream();
    loader()
      .then((mod) => {
        cached = mod.stream;
        const inner = mod.stream(model, context, options);
        forwardStream(stream, inner);
      })
      .catch((err) => {
        stream.push({
          type: "error",
          reason: "error",
          error: createError(model, err),
        });
        stream.end();
      });
    return stream;
  };
}

export function createLazySimpleStream(
  loader: () => Promise<{ streamSimple: SimpleStreamFunction }>,
): SimpleStreamFunction {
  let cached: SimpleStreamFunction | undefined;
  return (model, context, options) => {
    if (cached) return cached(model, context, options);

    const stream = new AssistantMessageEventStream();
    loader()
      .then((mod) => {
        cached = mod.streamSimple;
        const inner = mod.streamSimple(model, context, options);
        forwardStream(stream, inner);
      })
      .catch((err) => {
        stream.push({
          type: "error",
          reason: "error",
          error: createError(model, err),
        });
        stream.end();
      });
    return stream;
  };
}

// ── Internal helpers ────────────────────────────────────────────────────────

function forwardStream(target: AssistantMessageEventStream, source: AsyncIterable<any>): void {
  (async () => {
    for await (const event of source) {
      target.push(event);
    }
    target.end();
  })();
}

function createError(model: Model, err: unknown): AssistantMessage {
  return {
    role: "assistant",
    content: [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: {
      input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason: "error",
    errorMessage: err instanceof Error ? err.message : String(err),
    timestamp: Date.now(),
  };
}

// ── Re-export for convenience ───────────────────────────────────────────────

export { AssistantMessageEventStream } from "./stream.js";
