import type { ApiType, Model } from "./types.js";
import { MODELS } from "./models.generated.js";

const modelRegistry: Map<string, Map<string, Model>> = new Map();

for (const [provider, models] of Object.entries(MODELS)) {
  const providerModels = new Map<string, Model>();
  for (const [id, model] of Object.entries(models)) {
    providerModels.set(id, model as Model);
  }
  modelRegistry.set(provider, providerModels);
}

export function getModel(provider: string, modelId: string): Model {
  const providerModels = modelRegistry.get(provider);
  const model = providerModels?.get(modelId);
  if (!model) throw new Error(`Model not found: ${provider}/${modelId}`);
  return model;
}

export function getProviders(): string[] {
  return Array.from(modelRegistry.keys());
}

export function getModels(provider: string): Model[] {
  const models = modelRegistry.get(provider);
  return models ? Array.from(models.values()) : [];
}

export function modelsAreEqual(
  a: Model | null | undefined,
  b: Model | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.id === b.id && a.provider === b.provider;
}
