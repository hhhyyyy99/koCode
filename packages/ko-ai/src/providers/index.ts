/** Import and register all built-in providers. */
import { registerProvider, createLazyStream, createLazySimpleStream } from "../provider-registry.js";
import type { StreamFunction, SimpleStreamFunction } from "../provider-registry.js";

export function registerBuiltInProviders(): void {
  // Anthropic
  registerProvider({
    api: "anthropic-messages",
    stream: createLazyStream(() =>
      import("./anthropic.js").then((m) => ({ stream: m.streamAnthropic }))
    ),
    streamSimple: createLazySimpleStream(() =>
      import("./anthropic.js").then((m) => ({ streamSimple: m.streamSimpleAnthropic }))
    ),
  }, "builtin");

  // OpenAI
  registerProvider({
    api: "openai-completions",
    stream: createLazyStream(() =>
      import("./openai.js").then((m) => ({ stream: m.streamOpenAICompletions }))
    ),
    streamSimple: createLazySimpleStream(() =>
      import("./openai.js").then((m) => ({ streamSimple: m.streamSimpleOpenAICompletions }))
    ),
  }, "builtin");

  // Google
  registerProvider({
    api: "google-generative-ai",
    stream: createLazyStream(() =>
      import("./google.js").then((m) => ({ stream: m.streamGoogle }))
    ),
    streamSimple: createLazySimpleStream(() =>
      import("./google.js").then((m) => ({ streamSimple: m.streamSimpleGoogle }))
    ),
  }, "builtin");
}

// Auto-register on import
registerBuiltInProviders();
