import { randomUUID } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  type Model,
  type Message,
  type UserMessage,
  type AssistantMessage,
  type ToolResultMessage,
  type Context,
  type ToolCall,
  type StopReason,
  type Usage,
  stream,
  type AssistantMessageEvent,
  calculateCost,
} from "@kocode/ko-ai";

import {
  type AgentSessionEvent,
  type AgentSessionEventListener,
  type CompactionResult,
  type ThinkingLevel,
  type PermissionMode,
} from "./events.js";
import { appendMessage, createBranch, createSession, listBranches, listSessionSummaries, loadSession, sessionPathFor } from "./session-store.js";
import { generateSystemPrompt } from "./system-prompt.js";
import { permissionDecisionForTool, shouldRequestToolPermission, type ToolPermissionCategory } from "./tool-permissions.js";

// ============================================================================
// Tool executor interface
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolExecutor extends ToolDefinition {
  execute(input: Record<string, any>, cwd: string): Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  isError: boolean;
  content: string;
}

// ============================================================================
// AgentSession
// ============================================================================

export interface AgentSessionConfig {
  model: Model;
  cwd: string;
  tools?: ToolExecutor[];
  thinkingLevel?: ThinkingLevel;
  maxLoopCount?: number;
  sessionId?: string;
}

const DEFAULT_MAX_LOOPS = 100;
const COMPACTION_THRESHOLD = 0.8; // 80% of context window

export class AgentSession {
  readonly id: string;
  readonly sessionPath: string;

  private model: Model;
  private cwd: string;
  private tools: ToolExecutor[];
  private thinkingLevel: ThinkingLevel;
  private maxLoopCount: number;
  private permissionMode: PermissionMode = "default";

  private messages: Message[] = [];
  private listeners: AgentSessionEventListener[] = [];
  private abortController: AbortController | null = null;
  private running = false;
  private sessionUsage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
  private usageByModel = new Map<string, Usage>();
  private sessionStartedAt: number = Date.now();
  private apiDurationMs = 0;
  private codeChanges = { added: 0, removed: 0 };
  private pendingPermissions: Map<string, { resolve: (action: "approve" | "deny" | "approve_all") => void }> = new Map();
  private checkpoints: Map<string, { filePath: string; backupContent: string | null }> = new Map(); // trackId -> backup
  private turnCheckpoints: Map<number, string[]> = new Map(); // turn index -> trackIds

  constructor(config: AgentSessionConfig) {
    this.model = config.model;
    this.cwd = config.cwd;
    this.tools = config.tools ?? [];
    this.thinkingLevel = config.thinkingLevel ?? "off";
    this.maxLoopCount = config.maxLoopCount ?? DEFAULT_MAX_LOOPS;

    // Init session
    if (config.sessionId) {
      this.id = config.sessionId;
      this.sessionPath = sessionPathFor(config.sessionId);
      this.messages = loadSession(config.sessionId);
    } else {
      const { id, path } = createSession();
      this.id = id;
      this.sessionPath = path;
    }
  }

  // ── Event bus ──────────────────────────────────────────────────────────────

  addEventListener(listener: AgentSessionEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: AgentSessionEventListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private emit(event: AgentSessionEvent): void {
    for (const l of this.listeners) l(event);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  getModel(): Model { return this.model; }
  getThinkingLevel(): ThinkingLevel { return this.thinkingLevel; }
  getSessionId(): string { return this.id; }
  getCwd(): string { return this.cwd; }
  getMessages(): Message[] { return [...this.messages]; }
  isRunning(): boolean { return this.running; }

  setModel(model: Model): void {
    this.model = model;
    this.emit({ type: "model_changed", model });
  }

  setThinkingLevel(level: ThinkingLevel): void {
    this.thinkingLevel = level;
    this.emit({ type: "thinking_level_changed", level });
  }

  getPermissionMode(): PermissionMode { return this.permissionMode; }

  setPermissionMode(mode: PermissionMode): void {
    this.permissionMode = mode;
    this.emit({ type: "permission_mode_changed", mode });
  }

  /** Resolve a pending permission request. Called by TUI after user choice. */
  resolvePermission(requestId: string, action: "approve" | "deny" | "approve_all"): void {
    const pending = this.pendingPermissions.get(requestId);
    if (pending) {
      this.pendingPermissions.delete(requestId);
      pending.resolve(action);
    }
  }

  /** Get cumulative token usage for the session. */
  getUsage(): Usage { return cloneUsage(this.sessionUsage); }

  getUsageByModel(): Record<string, Usage> {
    return Object.fromEntries(
      Array.from(this.usageByModel.entries()).map(([key, usage]) => [key, cloneUsage(usage)]),
    );
  }

  getSessionStats(): { apiDurationMs: number; wallDurationMs: number; codeChanges: { added: number; removed: number } } {
    return {
      apiDurationMs: this.apiDurationMs,
      wallDurationMs: Math.max(0, Date.now() - this.sessionStartedAt),
      codeChanges: { ...this.codeChanges },
    };
  }

  /** Execute a shell command directly (for ! prefix). Returns stdout/stderr. */
  async execShell(command: string, _cwd?: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    this.emit({ type: "shell_start", command });
    const { exec } = await import("node:child_process");
    return new Promise((resolve) => {
      exec(command, { cwd: _cwd ?? this.cwd, timeout: 30000 }, (error, stdout, stderr) => {
        const result = {
          exitCode: error ? (error as any).code ?? 1 : 0,
          stdout: stdout.trimEnd(),
          stderr: stderr.trimEnd(),
        };
        this.emit({ type: "shell_end", ...result });
        resolve(result);
      });
    });
  }

  /** Save a memory line to .claude/CLAUDE.local.md (for # prefix). */
  async saveMemory(content: string, cwdOverride?: string): Promise<string> {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const base = cwdOverride ?? this.cwd;
    const claudeDir = path.join(base, ".claude");
    const filePath = path.join(claudeDir, "CLAUDE.local.md");
    await fs.mkdir(claudeDir, { recursive: true });
    const line = `${content.trim()}\n`;
    await fs.appendFile(filePath, line, "utf-8");
    this.emit({ type: "memory_saved", content: content.trim(), file: filePath });
    return filePath;
  }

  /** Save a checkpoint before a tool modifies a file. */
  async saveCheckpoint(filePath: string, trackId: string, turnIndex: number): Promise<void> {
    const fs = await import("node:fs/promises");
    try {
      const content = await fs.readFile(filePath, "utf-8");
      this.checkpoints.set(trackId, { filePath, backupContent: content });
    } catch {
      this.checkpoints.set(trackId, { filePath, backupContent: null });
    }
    if (!this.turnCheckpoints.has(turnIndex)) {
      this.turnCheckpoints.set(turnIndex, []);
    }
    this.turnCheckpoints.get(turnIndex)!.push(trackId);
  }

  /** Rewind the last turn: restore files to their pre-modification state. */
  async rewindLastTurn(): Promise<string[]> {
    const fs = await import("node:fs/promises");
    const lastTurn = this.messages.length; // approximate turn index
    const keys = Array.from(this.turnCheckpoints.keys()).sort((a, b) => b - a);
    if (keys.length === 0) return [];
    const lastKey = keys[0]!;
    const trackIds = this.turnCheckpoints.get(lastKey) ?? [];
    const restored: string[] = [];
    for (const id of trackIds) {
      const cp = this.checkpoints.get(id);
      if (cp) {
        if (cp.backupContent === null) {
          await fs.unlink(cp.filePath);
        } else {
          await fs.writeFile(cp.filePath, cp.backupContent, "utf-8");
        }
        restored.push(cp.filePath);
        this.checkpoints.delete(id);
      }
    }
    this.turnCheckpoints.delete(lastKey);
    return restored;
  }

  /** Create a branch snapshot from this session. */
  createBranch(name: string) {
    return createBranch(this.id, name);
  }

  /** List branches for this session. */
  listBranches() {
    return listBranches(this.id);
  }

  /** Replace the in-memory conversation with another persisted session. */
  resumeSession(sessionId: string): void {
    this.messages = loadSession(sessionId);
    this.emit({ type: "session_resumed", sessionId, messages: this.getMessages() } as AgentSessionEvent);
  }

  /** Get recent sessions for /resume. */
  static listSavedSessions() {
    return listSessionSummaries();
  }

  /** Get context breakdown for /context command. */
  getContextBreakdown(): Record<string, number> {
    const systemTokens = estimateTextTokens(generateSystemPromptPreview(this.tools, this.model));
    const commandsTokens = estimateTextTokens(this.tools.map((t) => `${t.name}: ${t.description}`).join("\n"));
    const claudeTokens = this.estimateClaudeMemoryTokens();
    const msgTokens = this.messages.reduce((sum, m) => {
      const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      return sum + estimateTextTokens(text);
    }, 0);
    return {
      "System prompt": systemTokens,
      "Built-in commands": commandsTokens,
      "CLAUDE.md": claudeTokens,
      "Conversation history": msgTokens,
      "Plugin/Skill context": 0,
      "Total": systemTokens + commandsTokens + claudeTokens + msgTokens,
    };
  }

  /** Send a user message and start the agent loop. */
  async prompt(
    content: string,
    options?: { images?: { data: string; mimeType: string }[] },
  ): Promise<AssistantMessage | null> {
    if (this.running) throw new Error("Agent is already running");

    this.running = true;
    this.abortController = new AbortController();

    // Record user message
    const userMsg: UserMessage = {
      role: "user",
      content: options?.images?.length
        ? [
            { type: "text", text: content },
            ...options.images.map((img) => ({ type: "image" as const, data: img.data, mimeType: img.mimeType })),
          ]
        : content,
      timestamp: Date.now(),
    };
    this.messages.push(userMsg);
    appendMessage(this.sessionPath, userMsg);

    this.emit({ type: "user_message", content, images: options?.images });

    this.emit({ type: "turn_start" });

    try {
      const result = await this.runAgentLoop();
      this.running = false;
      return result;
    } catch (err) {
      this.running = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ type: "agent_error", errorMessage: msg, willRetry: false });
      return null;
    }
  }

  /** Cancel the current turn. */
  cancel(): void {
    this.abortController?.abort();
    this.running = false;
    this.emit({ type: "turn_cancelled" });
  }

  /** Compact messages (manual trigger). */
  async compact(): Promise<void> {
    this.emit({ type: "compaction_start", reason: "manual" });
    const before = this.messages.length;
    const beforeTokens = this.estimateTokens();
    await this.performCompaction();
    const after = this.messages.length;
    const afterTokens = this.estimateTokens();
    this.emit({
      type: "compaction_end",
      reason: "manual",
      result: {
        inputTokensBefore: beforeTokens,
        inputTokensAfter: afterTokens,
        messagesBefore: before,
        messagesAfter: after,
      },
    });
  }

  // ── Agent loop ─────────────────────────────────────────────────────────────

  private async runAgentLoop(): Promise<AssistantMessage> {
    let loopCount = 0;
    const executedToolResults = new Map<string, ToolExecutionResult>();

    while (loopCount < this.maxLoopCount) {
      // NOTE: For simplicity, the abort signal is checked at the turn level.
      // Tool execution and individual provider calls are not directly
      // instrumented here because `stream()` does not accept a signal.
      // A future iteration can add per-request cancel support.

      if (this.abortController?.signal.aborted) {
        throw new Error("Turn cancelled");
      }

      // Check compaction
      const tokens = this.estimateTokens();
      const threshold = this.model.contextWindow * COMPACTION_THRESHOLD;
      if (tokens > threshold) {
        this.emit({ type: "compaction_start", reason: "threshold" });
        await this.performCompaction();
        this.emit({
          type: "compaction_end",
          reason: "threshold",
          result: {
            inputTokensBefore: tokens,
            inputTokensAfter: this.estimateTokens(),
            messagesBefore: this.messages.length,
            messagesAfter: this.messages.length,
          },
        });
      }

      // Build context
      const systemPrompt = await generateSystemPrompt(this.cwd, this.tools, this.model);
      const context: Context = {
        systemPrompt,
        messages: this.messages,
        tools: this.tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
      };

      // Stream
      const stream_ = stream(this.model, context, {
        signal: this.abortController?.signal,
        maxTokens: this.model.maxTokens,
        reasoning: this.thinkingLevel,
      } as any);

      const assistantMsg: AssistantMessage = {
        role: "assistant",
        content: [],
        api: this.model.api,
        provider: this.model.provider,
        model: this.model.id,
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
        stopReason: "stop",
        timestamp: Date.now(),
      };

      let stopped = false;
      const toolCallsById = new Map<string, ToolCall>();

      for await (const event of stream_) {
        switch (event.type) {
          case "start":
            this.emit({ type: "message_start", index: this.messages.length, partial: assistantMsg });
            break;

          case "text_delta":
            this.emitMessageDelta(assistantMsg, event.delta, "text");
            break;

          case "thinking_delta":
            this.emitThinkingDelta(assistantMsg, event.delta);
            break;

          case "toolcall_end":
            toolCallsById.set(event.toolCall.id, event.toolCall);
            this.upsertToolCallContent(assistantMsg, event.contentIndex, event.toolCall);
            break;

          case "done":
            assistantMsg.stopReason = event.message.stopReason;
            assistantMsg.usage = this.normalizeUsage(event.message.usage, context);
            this.accumulateUsage(assistantMsg.usage, `${assistantMsg.provider}/${assistantMsg.model}`);
            this.apiDurationMs += Math.max(0, Date.now() - assistantMsg.timestamp);
            assistantMsg.timestamp = Date.now();
            stopped = true;
            break;

          case "error":
            assistantMsg.stopReason = "error";
            assistantMsg.errorMessage = event.error.errorMessage;
            assistantMsg.usage = this.normalizeUsage(event.error.usage, context);
            this.accumulateUsage(assistantMsg.usage, `${assistantMsg.provider}/${assistantMsg.model}`);
            this.apiDurationMs += Math.max(0, Date.now() - assistantMsg.timestamp);
            assistantMsg.timestamp = Date.now();
            stopped = true;
            break;
        }
      }

      if (!stopped) {
        assistantMsg.stopReason = "error";
        assistantMsg.errorMessage = "Stream ended without terminal event";
      }

      this.emit({ type: "message_end", index: this.messages.length, message: assistantMsg });
      this.messages.push(assistantMsg);
      appendMessage(this.sessionPath, assistantMsg);

      // Execute tools if needed
      const toolCalls = Array.from(toolCallsById.values());
      if (toolCalls.length > 0 && assistantMsg.stopReason !== "error") {
        for (const tc of toolCalls) {
          const toolSignature = toolExecutionSignature(tc);
          const duplicateResult = executedToolResults.get(toolSignature);
          if (duplicateResult) {
            const duplicateToolMsg: ToolResultMessage = {
              role: "toolResult",
              toolCallId: tc.id,
              toolName: tc.name,
              content: [{ type: "text", text: duplicateResult.content }],
              isError: duplicateResult.isError,
              timestamp: Date.now(),
            };
            this.messages.push(duplicateToolMsg);
            appendMessage(this.sessionPath, duplicateToolMsg);
            continue;
          }

          const executor = this.tools.find((t) => t.name === tc.name);
          this.emit({ type: "tool_start", toolCallId: tc.id, toolName: tc.name, input: tc.arguments });

          // Permission check
          const permissionDecision = permissionDecisionForTool(tc.name, tc.arguments, this.permissionMode);
          const needsPermission = this.checkToolPermission(permissionDecision.category);
          if (needsPermission) {
            const requestId = randomUUID();
            const toolType = permissionDecision.requestToolType ?? "unknown";
            const description = permissionDecision.description;

            const permission = await new Promise<"approve" | "deny" | "approve_all">((resolve) => {
              this.pendingPermissions.set(requestId, { resolve });
              this.emit({
                type: "permission_request",
                requestId,
                toolType,
                toolName: tc.name,
                params: tc.arguments,
                description,
              });
            });

            if (permission === "deny") {
              const deniedResult: ToolExecutionResult = { isError: true, content: "Permission denied by user" };
              this.emit({
                type: "tool_end",
                toolCallId: tc.id,
                toolName: tc.name,
                result: deniedResult,
              });
              const deniedToolMsg: ToolResultMessage = {
                role: "toolResult",
                toolCallId: tc.id,
                toolName: tc.name,
                content: [{ type: "text", text: deniedResult.content }],
                isError: true,
                timestamp: Date.now(),
              };
              this.messages.push(deniedToolMsg);
              appendMessage(this.sessionPath, deniedToolMsg);
              continue;
            }

            if (permission === "approve_all") {
              // Approve all future tools of same type in this directory
              // For now, just continue without changing mode
            }
          }

          // Save checkpoint before file modifications
          const filePath = tc.arguments?.file_path as string | undefined;
          const fullPath = filePath ? (filePath.startsWith("/") ? filePath : `${this.cwd}/${filePath}`) : undefined;
          if (fullPath && (tc.name === "write" || tc.name === "edit")) {
            const trackId = randomUUID();
            await this.saveCheckpoint(fullPath, trackId, this.messages.length);
            this.recordCodeChange(tc.name, tc.arguments);
          }

          let result: ToolExecutionResult;
          if (executor) {
            try {
              result = await executor.execute(tc.arguments, this.cwd);
            } catch (e) {
              result = { isError: true, content: e instanceof Error ? e.message : String(e) };
            }
          } else {
            result = { isError: true, content: `Unknown tool: ${tc.name}` };
          }

          executedToolResults.set(toolSignature, result);
          this.emit({ type: "tool_end", toolCallId: tc.id, toolName: tc.name, result });

          const toolMsg: ToolResultMessage = {
            role: "toolResult",
            toolCallId: tc.id,
            toolName: tc.name,
            content: [{ type: "text", text: result.content }],
            isError: result.isError,
            timestamp: Date.now(),
          };
          this.messages.push(toolMsg);
          appendMessage(this.sessionPath, toolMsg);
        }
        loopCount++;
        // loop continues — the model may call more tools
      } else {
        // No tool calls — return final
        this.emit({
          type: "turn_end",
          usage: assistantMsg.usage,
          stopReason: assistantMsg.stopReason,
        });
        return assistantMsg;
      }
    }

    throw new Error(`Exceeded maximum agent loop count (${this.maxLoopCount})`);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private checkToolPermission(category: ToolPermissionCategory): boolean {
    return shouldRequestToolPermission(category, this.permissionMode);
  }

  private accumulateUsage(usage: Usage, modelKey: string): void {
    addUsage(this.sessionUsage, usage);
    const existing = this.usageByModel.get(modelKey) ?? emptyUsage();
    addUsage(existing, usage);
    this.usageByModel.set(modelKey, existing);
  }

  private normalizeUsage(usage: Usage, context: Context): Usage {
    const normalized = cloneUsage(usage);
    const hasReportedTokens =
      normalized.input > 0 ||
      normalized.output > 0 ||
      normalized.cacheRead > 0 ||
      normalized.cacheWrite > 0 ||
      normalized.totalTokens > 0;

    if (normalized.input <= 0 && hasReportedTokens) {
      normalized.input = Math.max(1, this.estimateContextInputTokens(context));
    }

    normalized.totalTokens =
      normalized.totalTokens > 0
        ? normalized.totalTokens
        : normalized.input + normalized.output + normalized.cacheRead + normalized.cacheWrite;

    if (normalized.cost.total <= 0 && normalized.totalTokens > 0) {
      normalized.cost = calculateCost(
        this.model.cost.input,
        this.model.cost.output,
        this.model.cost.cacheRead,
        this.model.cost.cacheWrite,
        normalized,
      );
    }

    return normalized;
  }

  private recordCodeChange(toolName: string, input: Record<string, any>): void {
    if (toolName === "write" && typeof input.content === "string") {
      this.codeChanges.added += countLines(input.content);
      return;
    }
    if (toolName === "edit") {
      if (typeof input.old_string === "string") this.codeChanges.removed += countLines(input.old_string);
      if (typeof input.new_string === "string") this.codeChanges.added += countLines(input.new_string);
    }
  }

  private estimateClaudeMemoryTokens(): number {
    const candidates = [
      join(this.cwd, ".claude", "CLAUDE.local.md"),
      join(this.cwd, "CLAUDE.md"),
    ];
    let totalBytes = 0;
    for (const candidate of candidates) {
      try {
        if (existsSync(candidate)) totalBytes += statSync(candidate).size;
      } catch {
        // Ignore unreadable optional memory files.
      }
    }
    return Math.ceil(totalBytes / 4);
  }

  private mergeDelta(cur: string, delta: string): string {
    if (!cur) return delta;
    if (!delta) return cur;
    const minLen = Math.min(cur.length, delta.length);
    for (let j = minLen; j > 0; j--) {
      if (cur.endsWith(delta.slice(0, j))) {
        return cur + delta.slice(j);
      }
    }
    return cur + delta;
  }

  private upsertToolCallContent(partial: AssistantMessage, contentIndex: number, toolCall: ToolCall): void {
    const existingIndex = partial.content.findIndex((block) => block.type === "toolCall" && block.id === toolCall.id);
    if (existingIndex >= 0) {
      partial.content[existingIndex] = toolCall;
      return;
    }
    if (contentIndex >= 0 && contentIndex <= partial.content.length) {
      partial.content.splice(contentIndex, 0, toolCall);
      return;
    }
    partial.content.push(toolCall);
  }

  private emitMessageDelta(partial: AssistantMessage, delta: string, _type: string): void {
    const lastContent = partial.content[partial.content.length - 1];
    if (!lastContent || lastContent.type !== "text") {
      partial.content.push({ type: "text", text: delta });
    } else {
      lastContent.text = this.mergeDelta(lastContent.text, delta);
    }
    this.emit({ type: "message_delta", index: this.messages.length, delta, partial });
  }

  private emitThinkingDelta(partial: AssistantMessage, delta: string): void {
    const lastThink = partial.content.filter((c) => c.type === "thinking").pop();
    if (lastThink && lastThink.type === "thinking") {
      lastThink.thinking = this.mergeDelta(lastThink.thinking, delta);
    } else {
      partial.content.push({ type: "thinking", thinking: delta });
    }
    const thinkIdx = partial.content.filter((c) => c.type === "thinking").length - 1;
    this.emit({ type: "thinking_delta", index: thinkIdx, delta, partial });
  }

  /** Rough token estimate: 4 chars ~= 1 token. */
  estimateTokens(): number {
    let total = 0;
    for (const msg of this.messages) {
      if (typeof msg.content === "string") {
        total += Math.ceil(msg.content.length / 4);
      } else {
        for (const block of msg.content) {
          if (block.type === "text" || block.type === "thinking") {
            total += Math.ceil(("text" in block ? (block as any).text : (block as any).thinking).length / 4);
          }
        }
      }
    }
    return total;
  }

  private estimateContextInputTokens(context: Context): number {
    let total = estimateTextTokens(context.systemPrompt ?? "");
    for (const msg of context.messages) {
      if (typeof msg.content === "string") {
        total += estimateTextTokens(msg.content);
      } else {
        total += estimateTextTokens(JSON.stringify(msg.content));
      }
    }
    if (context.tools?.length) {
      total += estimateTextTokens(JSON.stringify(context.tools));
    }
    return total;
  }

  /** Simple compaction: keep first (system+first user) + last 10 messages. */
  private async performCompaction(): Promise<void> {
    if (this.messages.length <= 12) return; // too small to compact

    const keepFirst = 2; // system prompt equivalent + first user
    const keepLast = 8;

    const head = this.messages.slice(0, keepFirst);
    const tail = this.messages.slice(-keepLast);

    // TODO: Summary of skipped messages via a separate LLM call
    this.messages = [...head, ...tail];
  }
}

function emptyUsage(): Usage {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function cloneUsage(usage: Usage): Usage {
  return { ...usage, cost: { ...usage.cost } };
}

function addUsage(target: Usage, next: Usage): void {
  target.input += next.input;
  target.output += next.output;
  target.cacheRead += next.cacheRead;
  target.cacheWrite += next.cacheWrite;
  target.totalTokens += next.totalTokens;
  target.cost.input += next.cost.input;
  target.cost.output += next.cost.output;
  target.cost.cacheRead += next.cost.cacheRead;
  target.cost.cacheWrite += next.cost.cacheWrite;
  target.cost.total += next.cost.total;
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.replace(/\n$/, "").split("\n").length;
}

function toolExecutionSignature(toolCall: ToolCall): string {
  return `${toolCall.name}:${stableStringify(toolCall.arguments)}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function estimateTextTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function generateSystemPromptPreview(tools: ToolExecutor[], model: Model): string {
  return [
    "koCode system prompt",
    model.provider,
    model.id,
    tools.map((tool) => tool.name).join(", "),
  ].join("\n");
}
