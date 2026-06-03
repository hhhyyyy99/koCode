import { randomUUID } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import * as os from "node:os";

import type { Message } from "@kocode/ko-ai";

export interface SessionSummary {
  id: string;
  path: string;
  name: string;
  lastAccessTime: number;
  model: string;
  turnCount: number;
}

export interface BranchInfo {
  name: string;
  sessionId: string;
  createdAt: number;
  sourceSessionId: string;
  current?: boolean;
}

// ============================================================================
// JSONL-based session persistence
// ============================================================================

const SESSIONS_DIR = join(os.homedir(), ".kocode", "sessions");

function ensureSessionsDir(): void {
  if (!existsSync(SESSIONS_DIR)) {
    mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

export function createSession(): { id: string; path: string } {
  ensureSessionsDir();
  const id = randomUUID();
  const path = join(SESSIONS_DIR, `${id}.jsonl`);
  writeFileSync(path, "");
  return { id, path };
}

export function sessionPathFor(sessionId: string): string {
  ensureSessionsDir();
  return join(SESSIONS_DIR, `${sessionId}.jsonl`);
}

export function loadSession(sessionId: string): Message[] {
  const path = sessionPathFor(sessionId);
  if (!existsSync(path)) return [];

  const lines = readFileSync(path, "utf-8")
    .split("\n")
    .filter((l) => l.trim());
  return lines.map((l) => JSON.parse(l) as Message);
}

export function appendMessage(sessionPath: string, message: Message): void {
  writeFileSync(sessionPath, JSON.stringify(message) + "\n", { flag: "a" });
}

export function getSessionsDir(): string {
  ensureSessionsDir();
  return SESSIONS_DIR;
}

export function listSessions(): { id: string; path: string }[] {
  ensureSessionsDir();
  return readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({ id: basename(f, ".jsonl"), path: join(SESSIONS_DIR, f) }));
}

export function listSessionSummaries(): SessionSummary[] {
  return listSessions()
    .map(({ id, path }) => {
      const messages = loadSession(id);
      const meta = readSessionMeta(id);
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant") as any;
      const stats = statSync(path);
      return {
        id,
        path,
        name: meta.name ?? id.slice(0, 8),
        lastAccessTime: stats.mtimeMs,
        model: lastAssistant?.provider && lastAssistant?.model ? `${lastAssistant.provider}/${lastAssistant.model}` : "unknown",
        turnCount: messages.filter((m) => m.role === "user").length,
      };
    })
    .sort((a, b) => b.lastAccessTime - a.lastAccessTime);
}

export function createBranch(sourceSessionId: string, name: string): BranchInfo {
  ensureSessionsDir();
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Branch name is required");
  const sourcePath = sessionPathFor(sourceSessionId);
  if (!existsSync(sourcePath)) throw new Error(`Session not found: ${sourceSessionId}`);
  const { id, path } = createSession();
  copyFileSync(sourcePath, path);
  const branch: BranchInfo = { name: cleanName, sessionId: id, createdAt: Date.now(), sourceSessionId };
  const branches = listBranches(sourceSessionId).filter((b) => b.name !== cleanName);
  writeFileSync(branchesPathFor(sourceSessionId), JSON.stringify([...branches, branch], null, 2));
  writeSessionMeta(id, { name: cleanName, branchOf: sourceSessionId });
  return branch;
}

export function listBranches(sessionId: string): BranchInfo[] {
  const branchesPath = branchesPathFor(sessionId);
  let branches: BranchInfo[] = [];
  if (existsSync(branchesPath)) {
    try { branches = JSON.parse(readFileSync(branchesPath, "utf-8")) as BranchInfo[]; } catch { branches = []; }
  }
  const bySession = new Map<string, BranchInfo>();
  bySession.set(sessionId, { name: "main", sessionId, createdAt: 0, sourceSessionId: sessionId, current: true });
  for (const branch of branches) {
    if (!bySession.has(branch.sessionId)) {
      bySession.set(branch.sessionId, { ...branch, current: branch.sessionId === sessionId });
    }
  }
  return Array.from(bySession.values());
}

function branchesPathFor(sessionId: string): string {
  ensureSessionsDir();
  return join(SESSIONS_DIR, `${sessionId}.branches.json`);
}

function metaPathFor(sessionId: string): string {
  ensureSessionsDir();
  return join(SESSIONS_DIR, `${sessionId}.meta.json`);
}

function readSessionMeta(sessionId: string): Record<string, any> {
  const metaPath = metaPathFor(sessionId);
  if (!existsSync(metaPath)) return {};
  try { return JSON.parse(readFileSync(metaPath, "utf-8")) as Record<string, any>; } catch { return {}; }
}

function writeSessionMeta(sessionId: string, patch: Record<string, any>): void {
  writeFileSync(metaPathFor(sessionId), JSON.stringify({ ...readSessionMeta(sessionId), ...patch }, null, 2));
}

export function deleteSession(sessionId: string): boolean {
  const path = join(SESSIONS_DIR, `${sessionId}.jsonl`);
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

export function renameSession(sessionId: string, newName: string): boolean {
  const oldPath = sessionPathFor(sessionId);
  if (!existsSync(oldPath)) return false;
  writeSessionMeta(sessionId, { name: newName });
  return true;
}
