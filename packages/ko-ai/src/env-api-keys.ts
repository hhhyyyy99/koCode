/**
 * Read API key from provider-specific environment variables.
 * Fallback: KOCODE_API_KEY.
 */
export function getEnvApiKey(provider: string): string | undefined {
  const keyMap: Record<string, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    together: process.env.TOGETHER_API_KEY,
    fireworks: process.env.FIREWORKS_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
  };
  return keyMap[provider] ?? process.env.KOCODE_API_KEY;
}
