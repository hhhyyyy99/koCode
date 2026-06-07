export type FocusMode =
  | "input"
  | "slash"
  | "status-modal"
  | "model-modal"
  | "theme-modal"
  | "session-modal"
  | "permission"
  | "rewind-confirm"
  | "tool-output"
  | "history-search";

export function isModalFocus(mode: FocusMode): boolean {
  return mode === "status-modal" || mode === "model-modal" || mode === "theme-modal" || mode === "session-modal" || mode === "permission" || mode === "rewind-confirm";
}

export function isTextInputFocus(mode: FocusMode): boolean {
  return mode === "input" || mode === "slash";
}

export function canUseGlobalShortcut(mode: FocusMode): boolean {
  return mode === "input" || mode === "tool-output";
}

export function restoreFocusAfterBlockingMode(previous: FocusMode | null | undefined): FocusMode {
  if (!previous || isModalFocus(previous) || previous === "history-search") return "input";
  return previous;
}

export function normalizeToolIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  if (index < 0) return count - 1;
  if (index >= count) return 0;
  return index;
}

export function moveToolIndex(index: number, count: number, direction: "next" | "previous"): number {
  return normalizeToolIndex(index + (direction === "next" ? 1 : -1), count);
}

export function isCtrlOInput(input: string, key: { ctrl?: boolean }): boolean {
  return key.ctrl === true && (input === "o" || input === "\u000f");
}

export function toggleExpandedToolId(expanded: Set<string>, toolKey: string | undefined): Set<string> {
  const next = new Set(expanded);
  if (!toolKey) return next;
  if (next.has(toolKey)) next.delete(toolKey);
  else next.add(toolKey);
  return next;
}

export interface CtrlOToolToggleState {
  focusMode: FocusMode;
  selectedToolIndex: number;
  toolKeys: string[];
  expandedToolIds: Set<string>;
}

export function applyCtrlOToolToggle(state: CtrlOToolToggleState): CtrlOToolToggleState {
  if (state.toolKeys.length === 0) return state;
  const selectedToolIndex = Math.min(state.selectedToolIndex, state.toolKeys.length - 1);
  const toolKey = state.toolKeys[selectedToolIndex];
  return {
    ...state,
    focusMode: "tool-output",
    selectedToolIndex,
    expandedToolIds: toggleExpandedToolId(state.expandedToolIds, toolKey),
  };
}

export function busySubmitMessage(text: string): string {
  return text.trim()
    ? "Agent is still running; draft kept. Submit after this turn finishes."
    : "Agent is still running.";
}

export function isBareEscapeInput(input: string): boolean {
  if (!input.includes("\x1b")) return false;
  return input.split("").every((char) => char === "\x1b");
}
