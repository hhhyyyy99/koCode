import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Model } from "@kocode/ko-ai";
import type { ToolExecutor } from "./agent-session.js";

export async function generateSystemPrompt(
  cwd: string,
  tools: ToolExecutor[],
  model: Model,
): Promise<string> {
  const today = new Date().toISOString().split("T")[0]!;

  // Build tool descriptions
  const toolList = tools.length > 0
    ? tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")
    : "(no tools)";

  // Scan project context files
  let projectContext = "";
  const contextFiles = [".kocode", "context.md", "CLAUDE.md"];
  for (const f of contextFiles) {
    const p = join(cwd, f);
    if (existsSync(p)) {
      try {
        projectContext += `\n### ${f}\n${readFileSync(p, "utf-8")}\n`;
      } catch { /* ignore */ }
    }
  }

  // Detect project info
  let gitInfo = "";
  if (existsSync(join(cwd, ".git"))) {
    gitInfo = "Project uses Git for version control.";
  }

  return [
    `You are an AI coding assistant running in the terminal.`,
    ``,
    `Today's date: ${today}`,
    ``,
    `You have access to tools that can read, write, and edit files, execute shell commands, and search the codebase.`,
    `Use these tools to help the user with software engineering tasks.`,
    ``,
    `## Available Tools`,
    toolList,
    ``,
    `## Guidelines`,
    `- Default to the user's language unless instructed otherwise.`,
    `- Be concise.`,
    `- When editing files, prefer Edit (for modifications) over Write (for full rewrites).`,
    `- Always verify changes before reporting them as complete.`,
    ``,
    projectContext ? `## Project Context${projectContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
