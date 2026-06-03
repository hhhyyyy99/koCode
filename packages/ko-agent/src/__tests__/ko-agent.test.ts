import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AgentSession } from "../agent-session";
import type { AgentSessionConfig } from "../agent-session";
import type { Model, Message, AssistantMessage } from "@kocode/ko-ai";
import { getDefaultTools } from "../tools/index";
import { appendMessage, createBranch, createSession, deleteSession, listBranches, listSessionSummaries, listSessions } from "../session-store.js";

// Re-export is fine in context, but for tests just run against TypeScript source
const mockModel: Model = {
  id: "claude-sonnet-4-5-20250514",
  name: "Test",
  api: "anthropic-messages" as any,
  provider: "anthropic",
  baseUrl: "https://api.anthropic.com",
  reasoning: true,
  input: ["text"],
  cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  contextWindow: 200000,
  maxTokens: 8192,
};

describe("AgentSession", () => {
  it("creates a session with an ID", () => {
    const config: AgentSessionConfig = {
      model: mockModel,
      cwd: "/tmp",
      tools: [],
    };
    const session = new AgentSession(config);
    expect(session.getSessionId()).toBeTruthy();
    expect(session.id).toBeTruthy();
    expect(session.getModel()).toBe(mockModel);
  });

  it("emits events via addEventListener", async () => {
    const config: AgentSessionConfig = {
      model: mockModel,
      cwd: "/tmp",
      tools: [],
    };
    const session = new AgentSession(config);
    const events: string[] = [];
    session.addEventListener((e) => events.push(e.type));

    // prompt will fail because no API key, but events should emit
    try {
      await session.prompt("hello");
    } catch {
      // expected
    }
    expect(events.length).toBeGreaterThan(0);
  });

  it("cancels a running session", async () => {
    const config: AgentSessionConfig = {
      model: mockModel,
      cwd: "/tmp",
      tools: [],
    };
    const session = new AgentSession(config);

    // Start a prompt, cancel it immediately
    const promise = session.prompt("test");
    await new Promise((r) => setTimeout(r, 5));
    session.cancel();
    await promise.catch(() => {});
    expect(session.isRunning()).toBe(false);
  });

  it("prevents concurrent prompts", async () => {
    const config: AgentSessionConfig = {
      model: mockModel,
      cwd: "/tmp",
      tools: [],
    };
    const session = new AgentSession(config);

    const p1 = session.prompt("first").catch(() => {});
    await expect(session.prompt("second")).rejects.toThrow("already running");
    await p1;
  });

  it("reports context breakdown and session stats", () => {
    const session = new AgentSession({
      model: mockModel,
      cwd: process.cwd(),
      tools: getDefaultTools(),
    });

    const breakdown = session.getContextBreakdown();
    expect(breakdown).toHaveProperty("System prompt");
    expect(breakdown).toHaveProperty("Built-in commands");
    expect(breakdown).toHaveProperty("CLAUDE.md");
    expect(breakdown).toHaveProperty("Conversation history");
    expect(breakdown).toHaveProperty("Total");

    const stats = session.getSessionStats();
    expect(stats.apiDurationMs).toBe(0);
    expect(stats.wallDurationMs).toBeGreaterThanOrEqual(0);
    expect(stats.codeChanges).toEqual({ added: 0, removed: 0 });
    expect(session.getUsageByModel()).toEqual({});
  });
  it("estimates token usage from messages", () => {
    const config: AgentSessionConfig = {
      model: mockModel,
      cwd: "/tmp",
      tools: [],
    };
    const session = new AgentSession(config);
    const tokens = session.estimateTokens();
    expect(typeof tokens).toBe("number");
    expect(tokens).toBe(0); // empty session
  });
});

describe("JSONL session store", () => {
  it("creates branch snapshots and session summaries", () => {
    const { id, path } = createSession();
    appendMessage(path, { role: "user", content: "hello", timestamp: Date.now() } as Message);

    const branch = createBranch(id, "experiment");
    expect(branch.name).toBe("experiment");
    expect(branch.sourceSessionId).toBe(id);
    expect(listBranches(id).map((b) => b.name)).toContain("experiment");

    const summaries = listSessionSummaries();
    expect(summaries.some((summary) => summary.id === id && summary.turnCount === 1)).toBe(true);

    deleteSession(id);
    deleteSession(branch.sessionId);
  });

  it("resumes messages into the current session and emits an event", () => {
    const { id, path } = createSession();
    appendMessage(path, { role: "user", content: "resume me", timestamp: Date.now() } as Message);
    const session = new AgentSession({ model: mockModel, cwd: "/tmp", tools: [] });
    const events: string[] = [];
    session.addEventListener((event) => events.push(event.type));

    session.resumeSession(id);

    expect(session.getMessages()).toHaveLength(1);
    expect(events).toContain("session_resumed");
    deleteSession(id);
  });
  it("creates, lists, and deletes sessions", () => {
    const { id } = createSession();
    const sessions = listSessions();
    expect(sessions.some((s) => s.id === id)).toBe(true);
    const deleted = deleteSession(id);
    expect(deleted).toBe(true);
  });
});
