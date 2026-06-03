import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Model } from "@kocode/ko-ai";
import { getModel, getProviders, getModels } from "@kocode/ko-ai";
import { AgentSession, getDefaultTools } from "@kocode/ko-agent";
import type { AgentSessionConfig } from "@kocode/ko-agent";
import {
  loadConfig,
  saveConfig,
  ensureConfigFile,
  getConfigPath,
  configGet,
  configSet,
  configUnset,
  formatConfigDisplay,
  defaultConfigTemplate,
  validateConfig,
} from "./config-command.js";

// ============================================================================
// Config types (shared with config-command.ts)
// ============================================================================

interface KoCodeConfig {
  providers?: Record<string, any>;
  default?: { provider: string; model: string };
  ui?: { theme?: string };
}

// ============================================================================
// Model resolution
// ============================================================================

function resolveModel(cfg: KoCodeConfig, provider?: string, modelId?: string): Model {
  const p = provider ?? cfg.default?.provider ?? "anthropic";
  const m = modelId ?? cfg.default?.model ?? "claude-sonnet-4-5-20250514";
  const providerCfg = cfg.providers?.[p];

  // 1. Custom models from config (explicit override)
  const customModels = providerCfg?.models;
  if (customModels?.[m]) {
    const def = customModels[m];
    return {
      id: m,
      name: def.name ?? m,
      api: def.api ?? "anthropic-messages",
      provider: p,
      baseUrl: def.baseUrl ?? providerCfg?.baseUrl ?? "https://api.anthropic.com",
      reasoning: def.reasoning ?? true,
      input: def.input ?? ["text"],
      cost: def.cost ?? { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
      contextWindow: def.contextWindow ?? 200000,
      maxTokens: def.maxTokens ?? 131072,
      compat: def.compat,
      headers: def.headers,
    };
  }

  // 2. Search built-in catalogue by model ID (across all known providers)
  let baseModel: Model | undefined;
  try { baseModel = getModel(p, m); } catch { /* not found under this provider */ }
  if (!baseModel) {
    for (const bp of getProviders()) {
      try { baseModel = getModel(bp, m); break; } catch { /* keep searching */ }
    }
  }

  if (baseModel) {
    // Reuse built-in metadata with custom provider's endpoint
    return {
      ...baseModel,
      provider: p,
      baseUrl: providerCfg?.baseUrl ?? baseModel.baseUrl,
    };
  }

  throw new Error(`Model not found: ${p}/${m}. Check ~/.kocode/config.yaml or run 'kocode models'`);
}

/** List all available models (built-in + custom providers) */
function listAllModels(cfg: KoCodeConfig): string[] {
  const result: string[] = [];
  // Built-in provider → model pairs
  for (const provider of getProviders()) {
    for (const m of getModels(provider)) {
      result.push(`${provider}/${m.id}`);
    }
  }
  // Custom providers: only list explicitly defined models
  if (cfg.providers) {
    for (const [pname, pcfg] of Object.entries(cfg.providers)) {
      if (getProviders().includes(pname)) continue;
      if (pcfg.models) {
        for (const mid of Object.keys(pcfg.models)) {
          result.push(`${pname}/${mid}`);
        }
      }
    }
  }
  return result.sort();
}

// ============================================================================
// CLI
// ============================================================================

async function handleConfigCommand(args: string[]): Promise<void> {
  const sub = args[1];
  const key = args[2];
  const value = args[3];

  switch (sub) {
    case "show":
    case undefined:
    case "": {
      const path = getConfigPath();
      console.log(`Config: ${path}`);
      const cfg = existsSync(path) ? loadConfig() : {};
      console.log(formatConfigDisplay(cfg));
      const errors = validateConfig(cfg);
      if (errors.length > 0) {
        console.error(`\n⚠ ${errors.length} config issues:`);
        for (const e of errors) console.error(`  - ${e.path}: ${e.message}`);
      }
      return;
    }

    case "get": {
      if (!key) { console.log("Usage: kocode config get <key>"); return; }
      const cfg = loadConfig();
      const val = configGet(cfg, key);
      if (val === undefined) {
        console.log(`(not set)`);
      } else if (typeof val === "object") {
        console.log(JSON.stringify(val, null, 2));
      } else {
        // Mask apiKey values
        if (key.endsWith("apiKey")) {
          const s = String(val);
          console.log(s.length > 8 ? s.slice(0, 4) + "..." + s.slice(-4) : "***");
        } else {
          console.log(String(val));
        }
      }
      return;
    }

    case "set": {
      if (!key || value === undefined) { console.log("Usage: kocode config set <key> <value>"); return; }
      const path = ensureConfigFile();
      const cfg = loadConfig();
      // Try parse value as YAML/JSON for complex types
      let parsed: unknown = value;
      try { parsed = JSON.parse(value); } catch { /* string */ }
      if (value === "true") parsed = true;
      if (value === "false") parsed = false;
      configSet(cfg, key, parsed);
      saveConfig(cfg, path);
      console.log(`Set ${key}`);
      return;
    }

    case "unset": {
      if (!key) { console.log("Usage: kocode config unset <key>"); return; }
      const path = ensureConfigFile();
      const cfg = loadConfig();
      const ok = configUnset(cfg, key);
      if (ok) {
        saveConfig(cfg, path);
        console.log(`Unset ${key}`);
      } else {
        console.log(`Key not found: ${key}`);
      }
      return;
    }

    case "open": {
      const path = ensureConfigFile();
      const editor = process.env.EDITOR || process.env.VISUAL || "vi";
      const { spawnSync } = await import("node:child_process");
      spawnSync(editor, [path], { stdio: "inherit" });
      return;
    }

    case "path": {
      console.log(getConfigPath());
      return;
    }

    case "init": {
      const path = getConfigPath();
      if (existsSync(path)) {
        console.log(`Config already exists: ${path}`);
        console.log("Use 'kocode config open' to edit, or delete it first to regenerate.");
        return;
      }
      const globalDir = join(homedir(), ".kocode");
      const { mkdirSync } = (await import("node:fs"));
      mkdirSync(globalDir, { recursive: true });
      const { writeFileSync } = (await import("node:fs"));
      writeFileSync(path, defaultConfigTemplate(), "utf-8");
      console.log(`Created: ${path}`);
      return;
    }

    default:
      console.log(`Usage: kocode config [show|get <key>|set <key> <value>|unset <key>|open|path|init]`);
  }
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);

  // ── config subcommand ──────────────────────────────────────────────────────
  if (rawArgs[0] === "config") {
    return handleConfigCommand(rawArgs);
  }

  // ── sessions subcommand ─────────────────────────────────────────────────────
  if (rawArgs[0] === "sessions") {
    const { listSessions, deleteSession, renameSession } = await import("@kocode/ko-agent");
    if (rawArgs[1] === "list") {
      for (const s of listSessions()) console.log(s.id);
      return;
    }
    if (rawArgs[1] === "delete" && rawArgs[2]) {
      console.log(deleteSession(rawArgs[2]) ? "Deleted" : "Not found");
      return;
    }
    if (rawArgs[1] === "rename" && rawArgs[2] && rawArgs[3]) {
      console.log(renameSession(rawArgs[2], rawArgs[3]) ? "Renamed" : "Not found");
      return;
    }
    console.log("Usage: kocode sessions <list|delete <id>|rename <id> <new-name>>");
    return;
  }

  // ── models subcommand ───────────────────────────────────────────────────────
  if (rawArgs[0] === "models") {
    const cfg = loadConfig();
    const models = listAllModels(cfg);
    for (const m of models) console.log(m);
    return;
  }

  // ── Main CLI parsing ────────────────────────────────────────────────────────
  const positional: string[] = [];
  let provider: string | undefined;
  let modelId: string | undefined;
  let sessionId: string | undefined;
  let printMode = false;
  let input = "";

  for (let i = 0; i < rawArgs.length; i++) {
    switch (rawArgs[i]) {
      case "--provider": provider = rawArgs[++i]; break;
      case "--model": modelId = rawArgs[++i]; break;
      case "--session": sessionId = rawArgs[++i]; break;
      case "--print": printMode = true; break;
      case "--help":
        console.log(`koCode - AI Coding Assistant
Usage: kocode [options] [message]
Options:
  --provider <name>   LLM provider (anthropic, openai, deepseek, google)
  --model <id>        Model ID
  --session <id>      Resume session
  --print             Non-interactive mode (print response to stdout)
  --help, --version   Show help/version
Commands:
  kocode config       Manage configuration
  kocode sessions     Manage sessions
  kocode models       List available models`);
        return;
      case "--version":
        console.log("koCode 0.1.0");
        return;
      default:
        if (rawArgs[i]?.startsWith("-")) break;
        positional.push(rawArgs[i]!);
    }
  }

  input = positional.join(" ");

  // Pipe input
  if (!process.stdin.isTTY && !input) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    input = Buffer.concat(chunks).toString("utf-8").trim();
    if (input && !printMode) printMode = true;
  }

  // Load config + resolve model
  const cfg = loadConfig();
  const model = resolveModel(cfg, provider, modelId);

  // Set env API key from config
  const apiKey = cfg.providers?.[model.provider]?.apiKey;
  if (apiKey) {
    const envVar = `${model.provider.toUpperCase()}_API_KEY`;
    if (!process.env[envVar]) process.env[envVar] = apiKey;
    if (!process.env.KOCODE_API_KEY) process.env.KOCODE_API_KEY = apiKey;
  }

  const sessionCfg: AgentSessionConfig = {
    model,
    cwd: process.cwd(),
    tools: getDefaultTools(),
    sessionId,
  };

  const session = new AgentSession(sessionCfg);

  if (printMode && input) {
    const result = await session.prompt(input);
    if (result) {
      for (const block of result.content) {
        if (block.type === "text") console.log(block.text);
      }
    }
    return;
  }

  // Interactive TUI
  const { run: runTui } = await import("@kocode/ko-tui");
  runTui(session, {
    theme: (cfg.ui?.theme as any) ?? "dark",
    onThemeChange: (theme) => {
      const path = ensureConfigFile();
      const latest = loadConfig();
      configSet(latest, "ui.theme", theme);
      saveConfig(latest, path);
    },
  });
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
