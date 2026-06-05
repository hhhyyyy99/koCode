import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import { resolve } from "node:path";
import type { ToolExecutor } from "../agent-session.js";

// ============================================================================
// Tool definitions — with JSON Schema validation, Bash policies, and
// permission hooks.
// ============================================================================

// ── Path sandbox ────────────────────────────────────────────────────────────

function safePath(cwd: string, target: string): { ok: true; path: string } | { ok: false; error: string } {
  const resolved = resolve(cwd, target);
  if (!resolved.startsWith(cwd)) return { ok: false, error: `Path traversal not allowed: ${target}` };
  return { ok: true, path: resolved };
}

// ── JSON Schema validation ──────────────────────────────────────────────────

interface JsonSchema {
  type?: string;
  properties?: Record<string, { type?: string; description?: string }>;
  required?: string[];
}

function validateSchema(schema: JsonSchema, input: Record<string, any>): string | null {
  if (!schema.properties) return null;
  if (schema.required) {
    for (const key of schema.required) {
      if (!(key in input)) return `Missing required parameter: ${key}`;
    }
  }
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (key in input) {
      const val = input[key];
      const expectedType = prop.type;
      if (expectedType === "string" && typeof val !== "string") return `Parameter '${key}' must be a string`;
      if (expectedType === "number" && typeof val !== "number") return `Parameter '${key}' must be a number`;
      if (expectedType === "boolean" && typeof val !== "boolean") return `Parameter '${key}' must be a boolean`;
      if (expectedType === "object" && (typeof val !== "object" || val === null)) return `Parameter '${key}' must be an object`;
    }
  }
  return null;
}

// ── Bash policies ──────────────────────────────────────────────────────────

interface BashPolicy {
  allow?: string[];   // Whitelist: if present, ONLY these commands are allowed
  deny?: string[];    // Blacklist: these commands are always rejected
}

let bashPolicy: BashPolicy = {};

export function setBashPolicy(policy: BashPolicy): void {
  bashPolicy = policy;
}

const DANGEROUS_COMMANDS = ["rm -rf /", "dd if=", "mkfs.", ":(){ :|:& };:", "> /dev/sda"];

function checkBashPolicy(command: string): string | null {
  // Check deny list
  if (bashPolicy.deny) {
    for (const denied of bashPolicy.deny) {
      if (command.includes(denied)) {
        return `Command '${command}' matches denied pattern: ${denied}`;
      }
    }
  }
  // Check allow list
  if (bashPolicy.allow && bashPolicy.allow.length > 0) {
    const cmdName = command.trim().split(/\s+/)[0] ?? "";
    const allowed = bashPolicy.allow.some((a) => {
      return cmdName === a || command.startsWith(a + " ") || command === a;
    });
    if (!allowed) return `Command '${cmdName}' is not in the allowed list`;
  }
  // Hard block dangerous patterns
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (command.includes(dangerous)) {
      return `Dangerous command blocked: ${dangerous}`;
    }
  }
  return null;
}

// ── Permission hook ─────────────────────────────────────────────────────────

export type PermissionChecker = (
  toolName: string,
  input: Record<string, any>,
) => Promise<boolean>;

let permissionChecker: PermissionChecker | null = null;

export function setPermissionChecker(checker: PermissionChecker | null): void {
  permissionChecker = checker;
}

async function checkPermission(toolName: string, input: Record<string, any>): Promise<string | null> {
  if (!permissionChecker) return null;
  const allowed = await permissionChecker(toolName, input);
  return allowed ? null : "Permission denied by user";
}

// ── Tool implementations ────────────────────────────────────────────────────

export const readTool: ToolExecutor = {
  name: "read",
  description: "Read the contents of a file",
  parameters: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Absolute path to the file" },
      offset: { type: "number", description: "Start line (1-indexed)" },
      limit: { type: "number", description: "Number of lines to read" },
    },
    required: ["file_path"],
  },
  async execute(input, cwd) {
    const err = validateSchema(readTool.parameters, input);
    if (err) return { isError: true, content: err };
    const sp = safePath(cwd, input.file_path);
    if (!sp.ok) return { isError: true, content: sp.error };
    const path = sp.path;
    if (!existsSync(path)) return { isError: true, content: `File not found: ${input.file_path}` };
    const content = readFileSync(path, "utf-8");
    const lines = content.split("\n");
    const start = (input.offset ?? 1) - 1;
    const end = input.limit ? start + input.limit : lines.length;
    const result = lines.slice(start, end).map((l, i) => `${start + i + 1}\t${l}`).join("\n");
    return { isError: false, content: result };
  },
};

export const writeTool: ToolExecutor = {
  name: "write",
  description: "Create a new file or overwrite an existing one",
  parameters: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Absolute path to the file" },
      content: { type: "string", description: "Content to write" },
    },
    required: ["file_path", "content"],
  },
  async execute(input, cwd) {
    const err = validateSchema(writeTool.parameters, input);
    if (err) return { isError: true, content: err };
    const permErr = await checkPermission("write", input);
    if (permErr) return { isError: true, content: permErr };
    const sp = safePath(cwd, input.file_path);
    if (!sp.ok) return { isError: true, content: sp.error };
    const path = sp.path;
    writeFileSync(path, input.content, "utf-8");
    return { isError: false, content: `File written: ${input.file_path}` };
  },
};

export const editTool: ToolExecutor = {
  name: "edit",
  description: "Replace a text string within a file",
  parameters: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Absolute path to the file" },
      old_string: { type: "string", description: "Exact text to replace" },
      new_string: { type: "string", description: "Replacement text" },
      replace_all: { type: "boolean", description: "Replace all occurrences (default: false)" },
    },
    required: ["file_path", "old_string", "new_string"],
  },
  async execute(input, cwd) {
    const err = validateSchema(editTool.parameters, input);
    if (err) return { isError: true, content: err };
    const permErr = await checkPermission("edit", input);
    if (permErr) return { isError: true, content: permErr };
    const sp = safePath(cwd, input.file_path);
    if (!sp.ok) return { isError: true, content: sp.error };
    const path = sp.path;
    if (!existsSync(path)) return { isError: true, content: `File not found: ${input.file_path}` };
    const content = readFileSync(path, "utf-8");
    if (!content.includes(input.old_string)) {
      return { isError: true, content: `String not found in file: "${input.old_string.slice(0, 60)}..."` };
    }
    const newContent = input.replace_all
      ? content.split(input.old_string).join(input.new_string)
      : content.replace(input.old_string, input.new_string);
    writeFileSync(path, newContent, "utf-8");
    return { isError: false, content: `Edited file: ${input.file_path}` };
  },
};

export const bashTool: ToolExecutor = {
  name: "bash",
  description: "Execute a shell command",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to execute" },
      timeout: { type: "number", description: "Timeout in milliseconds" },
    },
    required: ["command"],
  },
  async execute(input, cwd) {
    const err = validateSchema(bashTool.parameters, input);
    if (err) return { isError: true, content: err };
    const policyErr = checkBashPolicy(input.command);
    if (policyErr) return { isError: true, content: policyErr };
    const permErr = await checkPermission("bash", input);
    if (permErr) return { isError: true, content: permErr };
    const timeoutMs = input.timeout ?? 30000;
    return new Promise((resolve) => {
      const proc = spawn(input.command, { shell: true, cwd, detached: true });
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        try { process.kill(-proc.pid!, "SIGKILL"); } catch { proc.kill("SIGKILL"); }
      }, timeoutMs);
      proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
      proc.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve({ isError: false, content: stdout });
        } else {
          resolve({ isError: true, content: stderr || stdout || `Process exited with code ${code}` });
        }
      });
      proc.on("error", (e) => {
        clearTimeout(timer);
        resolve({ isError: true, content: e.message });
      });
    });
  },
};

export const grepTool: ToolExecutor = {
  name: "grep",
  description: "Search for a pattern in files",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regex pattern to search for" },
      path: { type: "string", description: "Directory to search in (default: cwd)" },
    },
    required: ["pattern"],
  },
  async execute(input, cwd) {
    const err = validateSchema(grepTool.parameters, input);
    if (err) return { isError: true, content: err };
    const searchPath = input.path ?? ".";
    try {
      const result = execSync(
        `grep -rnh --color=never "${String(input.pattern).replace(/"/g, '\\"')}" "${searchPath}"`,
        { cwd, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
      );
      return { isError: false, content: result || "No matches found" };
    } catch (e: any) {
      if (e.status === 1) return { isError: false, content: "No matches found" };
      return { isError: true, content: e.stderr ?? e.message };
    }
  },
};

export const findTool: ToolExecutor = {
  name: "find",
  description: "Find files matching a pattern",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Glob pattern (e.g., '*.ts', 'src/**/*.js')" },
      path: { type: "string", description: "Directory to search in (default: cwd)" },
    },
    required: ["pattern"],
  },
  async execute(input, cwd) {
    const err = validateSchema(findTool.parameters, input);
    if (err) return { isError: true, content: err };
    const searchPath = input.path ?? ".";
    try {
      const result = execSync(
        `find "${searchPath}" -type f -name "${input.pattern}"`,
        { cwd, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
      );
      return { isError: false, content: result || "No files found" };
    } catch (e: any) {
      return { isError: true, content: e.stderr ?? e.message };
    }
  },
};

export const lsTool: ToolExecutor = {
  name: "ls",
  description: "List directory contents",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory to list (default: cwd)" },
    },
    required: [],
  },
  async execute(input, cwd) {
    const dirPath = input.path ?? cwd;
    if (!existsSync(dirPath)) return { isError: true, content: `Directory not found: ${dirPath}` };
    const entries = readdirSync(dirPath);
    const listing = entries
      .map((name) => {
        const s = statSync(resolve(dirPath, name));
        const type = s.isDirectory() ? "d" : "-";
        const size = String(s.size).padStart(10);
        return `${type} ${size} ${name}`;
      })
      .join("\n");
    return { isError: false, content: listing };
  },
};

export function getDefaultTools(): ToolExecutor[] {
  return [readTool, editTool, writeTool, bashTool, grepTool, findTool, lsTool];
}
