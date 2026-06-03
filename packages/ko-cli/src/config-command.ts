import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as yaml from "yaml";

// ============================================================================
// Config types
// ============================================================================

export interface KoCodeConfig {
  providers?: Record<string, any>;
  default?: { provider: string; model: string };
  ui?: { theme?: string };
}

// ============================================================================
// Config validation
// ============================================================================

export interface ConfigValidationError {
  path: string;
  message: string;
}

export function validateConfig(cfg: any): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (!cfg || typeof cfg !== "object") {
    errors.push({ path: "", message: "Config must be an object" });
    return errors;
  }

  // Validate providers
  if (cfg.providers) {
    if (typeof cfg.providers !== "object") {
      errors.push({ path: "providers", message: "Must be an object" });
    } else {
      for (const [name, provider] of Object.entries(cfg.providers)) {
        if (!provider || typeof provider !== "object") {
          errors.push({ path: `providers.${name}`, message: "Must be an object" });
          continue;
        }
        const p = provider as any;
        if (!p.apiKey || typeof p.apiKey !== "string") {
          errors.push({ path: `providers.${name}.apiKey`, message: "Required: string" });
        }
        if (p.baseUrl !== undefined && typeof p.baseUrl !== "string") {
          errors.push({ path: `providers.${name}.baseUrl`, message: "Must be a string" });
        }
        // Validate custom models
        if (p.models) {
          if (typeof p.models !== "object") {
            errors.push({ path: `providers.${name}.models`, message: "Must be an object" });
          } else {
            for (const [mid, mdef] of Object.entries(p.models)) {
              if (mdef && typeof mdef === "object") {
                const md = mdef as any;
                if (md.contextWindow !== undefined && (typeof md.contextWindow !== "number" || md.contextWindow <= 0)) {
                  errors.push({ path: `providers.${name}.models.${mid}.contextWindow`, message: "Must be a positive number" });
                }
                if (md.maxTokens !== undefined && (typeof md.maxTokens !== "number" || md.maxTokens <= 0)) {
                  errors.push({ path: `providers.${name}.models.${mid}.maxTokens`, message: "Must be a positive number" });
                }
                if (md.cost !== undefined && typeof md.cost !== "object") {
                  errors.push({ path: `providers.${name}.models.${mid}.cost`, message: "Must be an object with input/output/cacheRead/cacheWrite" });
                }
              }
            }
          }
        }
      }
    }
  }

  // Validate UI settings
  if (cfg.ui) {
    if (typeof cfg.ui !== "object") {
      errors.push({ path: "ui", message: "Must be an object" });
    } else if (cfg.ui.theme !== undefined && typeof cfg.ui.theme !== "string") {
      errors.push({ path: "ui.theme", message: "Must be a string" });
    }
  }

  // Validate default
  if (cfg.default) {
    if (typeof cfg.default !== "object") {
      errors.push({ path: "default", message: "Must be an object" });
    } else {
      const d = cfg.default;
      if (d.provider && typeof d.provider !== "string") {
        errors.push({ path: "default.provider", message: "Must be a string" });
      }
      if (d.model && typeof d.model !== "string") {
        errors.push({ path: "default.model", message: "Must be a string" });
      }
      // Check provider exists
      if (d.provider && cfg.providers && !cfg.providers[d.provider]) {
        errors.push({ path: "default.provider", message: `Provider "${d.provider}" not found in providers list` });
      }
    }
  }

  return errors;
}

// ============================================================================
// Config file helpers
// ============================================================================

export function getConfigPath(): string {
  const projectPath = join(process.cwd(), ".kocode", "config.yaml");
  if (existsSync(projectPath)) return projectPath;
  return join(homedir(), ".kocode", "config.yaml");
}

export function ensureConfigFile(): string {
  const globalDir = join(homedir(), ".kocode");
  if (!existsSync(globalDir)) {
    const { mkdirSync } = require("node:fs");
    mkdirSync(globalDir, { recursive: true });
  }
  const path = join(globalDir, "config.yaml");
  if (!existsSync(path)) {
    writeFileSync(path, defaultConfigTemplate(), "utf-8");
  }
  return path;
}

export function defaultConfigTemplate(): string {
  return `# koCode configuration
# See https://github.com/kocode/kocode for full documentation

# providers:
#   anthropic:
#     apiKey: "sk-ant-xxx"
#   openai:
#     apiKey: "sk-xxx"
#     baseUrl: "https://api.openai.com/v1"
#   deepseek:
#     apiKey: "sk-xxx"
#     baseUrl: "https://api.deepseek.com/v1"

# default:
#   provider: "anthropic"
#   model: "claude-sonnet-4-5-20250514"

# ui:
#   theme: "dark"
`;
}

export function loadConfig(): KoCodeConfig {
  const path = getConfigPath();
  if (!existsSync(path)) return {};

  try {
    const raw = yaml.parse(readFileSync(path, "utf-8")) ?? {};
    const errors = validateConfig(raw);
    if (errors.length > 0) {
      console.error("[kocode] Config warnings:");
      for (const e of errors) {
        console.error(`  ${e.path}: ${e.message}`);
      }
    }
    return raw as KoCodeConfig;
  } catch (err: any) {
    console.error(`[kocode] Failed to parse config: ${err.message}`);
    return {};
  }
}

export function saveConfig(cfg: KoCodeConfig, targetPath?: string): void {
  const path = targetPath ?? ensureConfigFile();
  writeFileSync(path, yaml.stringify(cfg, null, 2), "utf-8");
}

// Read value by dot-path
export function configGet(cfg: any, key: string): unknown {
  const parts = key.split(".");
  let current = cfg;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

// Set value by dot-path (mutates object)
export function configSet(cfg: any, key: string, value: unknown): void {
  const parts = key.split(".");
  let current = cfg;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    if (!current[p] || typeof current[p] !== "object") {
      current[p] = {};
    }
    current = current[p];
  }
  current[parts[parts.length - 1]!] = value;
}

// Delete value by dot-path (mutates object)
export function configUnset(cfg: any, key: string): boolean {
  const parts = key.split(".");
  let current = cfg;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    if (current[p] == null || typeof current[p] !== "object") return false;
    current = current[p];
  }
  const last = parts[parts.length - 1]!;
  if (last in current) {
    delete current[last];
    return true;
  }
  return false;
}

// Mask API keys for display
function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "***";
  return key.slice(0, 4) + "..." + key.slice(-4);
}

export function formatConfigDisplay(cfg: any): string {
  if (!cfg || Object.keys(cfg).length === 0) return "(empty)";

  const safe = JSON.parse(JSON.stringify(cfg));
  // Mask all apiKey fields
  function mask(obj: any) {
    if (!obj || typeof obj !== "object") return;
    if (obj.apiKey) obj.apiKey = maskApiKey(obj.apiKey);
    for (const v of Object.values(obj)) mask(v);
  }
  mask(safe);

  return yaml.stringify(safe, null, 2);
}
