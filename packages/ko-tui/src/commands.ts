import type { AgentSession } from "@kocode/ko-agent";
import { getProviders, getModels, getModel } from "@kocode/ko-ai";
import { getBuiltinThemes, type ThemeName } from "./theme.js";

export interface CommandContext {
  currentTheme?: string;
  setTheme?: (name: string) => boolean;
  openBranchPanel?: () => void;
  openResumePanel?: () => void;
  openThemePanel?: () => void;
  onThemeChange?: (name: ThemeName) => void;
}

export interface CommandDef {
  name: string;
  description: string;
  source?: string;
  /** If true, this command takes arguments (e.g. /model <id>). If false, executes immediately on Enter. */
  takesArgs?: boolean;
  handler: (args: string, session: AgentSession, notify: (msg: string) => void, context?: CommandContext) => void;
}

export function getCommands(): CommandDef[] {
  return [
    // === Session ===
    {
      name: "/help",
      description: "Show help",
      handler: (_args, _session, notify) => {
        notify(
          getCommands()
            .map((c) => `${c.name.padEnd(18)} ${c.description}`)
            .join("\n"),
        );
      },
    },
    {
      name: "/clear",
      description: "Clear conversation history",
      handler: (_args, _session, notify) => {
        notify("Conversation cleared");
      },
    },
    {
      name: "/compact",
      description: "Compact conversation context",
      handler: async (_args, session, notify) => {
        try {
          await session.compact();
          notify("Context compacted");
        } catch {
          notify("Compact failed");
        }
      },
    },
    {
      name: "/resume",
      description: "Resume a previous session",
      handler: (_args, _session, notify, context) => {
        if (context?.openResumePanel) {
          context.openResumePanel();
        } else {
          notify("Resume UI unavailable");
        }
      },
    },
    {
      name: "/branch",
      takesArgs: true,
      description: "Create or list conversation branches",
      handler: (args, session, notify, context) => {
        const name = args.trim();
        if (!name) {
          context?.openBranchPanel?.();
          return;
        }
        try {
          const branch = session.createBranch(name);
          notify(`Created branch ${branch.name} (${branch.sessionId.slice(0, 8)})`);
        } catch (error) {
          notify(`Branch error: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    },
    {
      name: "/quit",
      description: "Exit koCode",
      handler: () => { process.exit(0); },
    },
    {
      name: "/exit",
      description: "Exit koCode",
      handler: () => { process.exit(0); },
    },

    // === Information ===
    {
      name: "/context",
      description: "Show context token usage",
      handler: (_args, session, notify) => {
        notify(formatContextBreakdown(session));
      },
    },
    {
      name: "/cost",
      description: "Show session cost and usage",
      handler: (_args, session, notify) => {
        notify(formatUsageReport(session));
      },
    },
    {
      name: "/diff",
      description: "Show code changes",
      handler: (_args, _session, notify) => {
        notify("Diff: showing uncommitted changes (coming soon)");
      },
    },
    {
      name: "/rewind",
      description: "Rewind the last file change",
      handler: async (_args, session, notify) => {
        try {
          const files = await session.rewindLastTurn();
          notify(files.length > 0 ? `Rewound: restored ${files.join(", ")}` : "Nothing to rewind");
        } catch (error) {
          notify(`Rewind error: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    },
    {
      name: "/status",
      description: "Show session status",
      handler: (_args, session, notify) => {
        const m = session.getModel();
        notify(
          [
            `Version: koCode v0.1.0`,
            `Session ID: ${session.getSessionId()}`,
            `cwd: ${session.getCwd()}`,
            `Model: ${m.provider}/${m.id}`,
            `Permission: ${session.getPermissionMode()}`,
          ].join("\n"),
        );
      },
    },
    {
      name: "/session",
      description: "Show session ID and info",
      handler: (_args, session, notify) => {
        notify(`Session: ${session.getSessionId()}\nPath: ${session.sessionPath}`);
      },
    },

    // === Configuration ===
    {
      name: "/model",
      takesArgs: true,
      description: "Switch model (/model <provider>/<id>)",
      handler: (args, session, notify) => {
        if (args) {
          const [provider, modelId] = args.split("/");
          if (provider && modelId) {
            try {
              const current = session.getModel();
              const newModel = current.provider === provider && current.id === modelId
                ? current
                : getModel(provider, modelId);
              session.setModel(newModel);
              notify(`Switched to ${provider}/${modelId}`);
            } catch {
              notify(`Model not found: ${args}`);
            }
          } else {
            notify(`Usage: /model <provider>/<modelId>`);
          }
        } else {
          notify("Use /model <provider>/<id> to switch. Use /models to list.");
        }
      },
    },
    {
      name: "/models",
      description: "List available models",
      handler: (_args, _session, notify) => {
        try {
          const providers = getProviders();
          const lines: string[] = [];
          for (const p of providers) {
            const models = getModels(p);
            for (const m of models) lines.push(`  ${p}/${m.id}`);
          }
          notify(["Available models:", ...lines].join("\n"));
        } catch {
          notify("Failed to list models");
        }
      },
    },
    {
      name: "/config",
      description: "Open config panel (coming soon)",
      handler: (_args, _session, notify) => {
        notify("Config panel coming soon. Edit config.yaml to configure.");
      },
    },
    {
      name: "/init",
      description: "Initialize CLAUDE.md for project",
      handler: (_args, session, notify) => {
        const cwd = session.getCwd();
        notify(`Run: touch ${cwd}/CLAUDE.md to create project memory`);
      },
    },
    {
      name: "/permissions",
      description: "Show permissions",
      handler: (_args, session, notify) => {
        notify(`Current permission mode: ${session.getPermissionMode()}`);
      },
    },
    {
      name: "/theme",
      description: "Switch theme",
      handler: (args, _session, notify, context) => {
        const themes = getBuiltinThemes().map((theme) => theme.name);
        const requested = args.trim();
        if (!requested) {
          if (context?.openThemePanel) {
            context.openThemePanel();
            return;
          }
          notify(`Available themes: ${themes.join(", ")}. Current: ${context?.currentTheme ?? "dark"}`);
          return;
        }
        if (!themes.includes(requested as ThemeName)) {
          notify(`Unknown theme: ${requested}. Available themes: ${themes.join(", ")}`);
          return;
        }
        if (context?.setTheme?.(requested)) {
          context.onThemeChange?.(requested as ThemeName);
          notify(`Theme switched to ${requested}`);
          return;
        }
        notify(`Theme switching unavailable in this view. Available themes: ${themes.join(", ")}`);
      },
    },

    // === Development ===
    {
      name: "/review",
      description: "Review current changes",
      handler: (_args, _session, notify) => {
        notify("Review: code review coming soon");
      },
    },
    {
      name: "/doctor",
      description: "Run health check",
      handler: (_args, _session, notify) => {
        notify("Doctor: health check coming soon");
      },
    },
    {
      name: "/export",
      description: "Export conversation",
      handler: (_args, _session, notify) => {
        notify("Export: conversation export coming soon");
      },
    },
    {
      name: "/skills",
      description: "List available skills",
      handler: (_args, _session, notify) => {
        notify("Skills: listing coming soon");
      },
    },
    {
      name: "/feedback",
      description: "Submit feedback",
      handler: (_args, _session, notify) => {
        notify("Feedback: submit to https://github.com/.../issues");
      },
    },
  ];
}

export function normalizeCommandQuery(query: string): string {
  return query.trim().replace(/^\//, "").toLowerCase();
}

function commandNameMatchRank(command: CommandDef, query: string): number | null {
  if (!query) return 0;

  const name = command.name.toLowerCase();
  const bareName = name.startsWith("/") ? name.slice(1) : name;

  if (query === name || query === bareName) return 1;
  if (name.startsWith(query) || bareName.startsWith(query)) return 2;
  if (name.includes(query) || bareName.includes(query)) return 3;
  return null;
}

function commandDescriptionMatchRank(command: CommandDef, query: string): number | null {
  if (!query) return 0;
  return command.description.toLowerCase().includes(query) ? 4 : null;
}

export function filterCommands(query: string): CommandDef[] {
  const q = normalizeCommandQuery(query);
  const commands = getCommands();
  const nameMatches = rankedCommandMatches(commands, q, commandNameMatchRank);
  if (nameMatches.length > 0) return nameMatches;
  return rankedCommandMatches(commands, q, commandDescriptionMatchRank);
}

function rankedCommandMatches(
  commands: CommandDef[],
  query: string,
  rankCommand: (command: CommandDef, query: string) => number | null,
): CommandDef[] {
  return commands
    .map((command, index) => ({ command, index, rank: rankCommand(command, query) }))
    .filter((item): item is { command: CommandDef; index: number; rank: number } => item.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((item) => item.command);
}


export function formatContextBreakdown(session: AgentSession): string {
  const breakdown = session.getContextBreakdown();
  const total = breakdown.Total ?? 0;
  const contextWindow = session.getModel().contextWindow || 0;
  const ratio = contextWindow > 0 ? total / contextWindow : 0;
  const health = ratio > 0.85
    ? "red: context high, consider /compact"
    : ratio >= 0.7
      ? "yellow: context approaching limit"
      : "green: context healthy";

  const rows = Object.entries(breakdown).filter(([name]) => name !== "Total");
  return [
    "Context breakdown:",
    ...rows.map(([name, tokens], index) => {
      const connector = index === rows.length - 1 ? "└" : "├";
      return `${connector} ${name}: ~${tokens} tokens`;
    }),
    `└ Total: ~${total} tokens`,
    `Health: ${health}`,
  ].join("\n");
}

export function formatUsageReport(session: AgentSession): string {
  const usage = session.getUsage();
  const stats = session.getSessionStats();
  const byModel = session.getUsageByModel();
  const modelRows = Object.entries(byModel);

  return [
    `Total cost: $${usage.cost.total.toFixed(4)}`,
    `Total API duration: ${formatDuration(stats.apiDurationMs)}`,
    `Total wall duration: ${formatDuration(stats.wallDurationMs)}`,
    `Code changes: +${stats.codeChanges.added} / -${stats.codeChanges.removed}`,
    "Usage by model:",
    ...(modelRows.length > 0
      ? modelRows.map(([model, u]) => `  ${model}: input ${u.input}, output ${u.output}, cache read ${u.cacheRead}, cache write ${u.cacheWrite}, cost $${u.cost.total.toFixed(4)}`)
      : [`  ${session.getModel().provider}/${session.getModel().id}: input ${usage.input}, output ${usage.output}, cache read ${usage.cacheRead}, cache write ${usage.cacheWrite}, cost $${usage.cost.total.toFixed(4)}`]),
  ].join("\n");
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
}
