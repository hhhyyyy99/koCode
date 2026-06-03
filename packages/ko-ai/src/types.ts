// ============================================================================
// Core LLM Types — provider-neutral contract between ko-ai, ko-agent, and ko-tui
//
// Each provider adapter maps its native shapes into these unified types.
// ============================================================================

// ── Content blocks ──────────────────────────────────────────────────────────

export interface TextContent {
  type: "text";
  text: string;
}

export interface ThinkingContent {
  type: "thinking";
  thinking: string;
  /** Encrypted redacted data. Opaque payload passed back for multi-turn continuity. */
  signature?: string;
  /** True when the thinking content was redacted by safety filters. */
  redacted?: boolean;
}

export interface ImageContent {
  type: "image";
  data: string; // base64
  mimeType: string; // e.g. "image/png"
}

export interface ToolCall {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, any>;
}

// ── Usage & stop ────────────────────────────────────────────────────────────

export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}

export type StopReason = "stop" | "length" | "toolUse" | "error" | "aborted";

// ── Messages ────────────────────────────────────────────────────────────────

export interface UserMessage {
  role: "user";
  content: string | (TextContent | ImageContent)[];
  timestamp: number;
}

export interface AssistantMessage {
  role: "assistant";
  content: (TextContent | ThinkingContent | ToolCall)[];
  api: string;
  provider: string;
  model: string;
  /** Concrete model when different from the requested id (e.g. OpenRouter auto routing). */
  responseModel?: string;
  responseId?: string;
  usage: Usage;
  stopReason: StopReason;
  errorMessage?: string;
  timestamp: number;
}

export interface ToolResultMessage<TDetails = any> {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: (TextContent | ImageContent)[];
  details?: TDetails;
  isError: boolean;
  timestamp: number;
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

// ── Tool definition (provider-neutral) ──────────────────────────────────────

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema object
}

// ── Context ─────────────────────────────────────────────────────────────────

export interface Context {
  systemPrompt?: string;
  messages: Message[];
  tools?: Tool[];
}

// ── Model ───────────────────────────────────────────────────────────────────

export type ApiType =
  | "anthropic-messages"
  | "openai-completions"
  | "google-generative-ai"
  | (string & {});

export interface ModelCost {
  input: number; // $/M tokens
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface Model<TApi extends ApiType = ApiType> {
  id: string;
  name: string;
  api: TApi;
  provider: string;
  baseUrl: string;
  reasoning: boolean;
  input: ("text" | "image")[];
  cost: ModelCost;
  contextWindow: number;
  maxTokens: number;
  headers?: Record<string, string>;
  compat?: Record<string, any>;
}

// ── Thinking levels ─────────────────────────────────────────────────────────

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high";
export type ThinkingLevelMap = Partial<Record<ThinkingLevel | "xhigh", string | null>>;

// ── Stream options ──────────────────────────────────────────────────────────

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  apiKey?: string;
  sessionId?: string;
  /** HTTP request timeout in ms. */
  timeoutMs?: number;
  /** Max retry attempts. */
  maxRetries?: number;
  headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface SimpleStreamOptions extends StreamOptions {
  reasoning?: ThinkingLevel;
}

// ── Provider response hook ──────────────────────────────────────────────────

export interface ProviderResponse {
  status: number;
  headers: Record<string, string>;
}

// ── Cost calculation helper ─────────────────────────────────────────────────

export function calculateCost(
  inputCostPerM: number,
  outputCostPerM: number,
  cacheReadCostPerM: number,
  cacheWriteCostPerM: number,
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number },
): Usage["cost"] {
  const input = (inputCostPerM / 1_000_000) * usage.input;
  const output = (outputCostPerM / 1_000_000) * usage.output;
  const cacheRead = (cacheReadCostPerM / 1_000_000) * usage.cacheRead;
  const cacheWrite = (cacheWriteCostPerM / 1_000_000) * usage.cacheWrite;
  return { input, output, cacheRead, cacheWrite, total: input + output + cacheRead + cacheWrite };
}
