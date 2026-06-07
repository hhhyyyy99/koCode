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
  | "transcript-block"
  | "history-search";

export function isModalFocus(mode: FocusMode): boolean {
  return mode === "status-modal" || mode === "model-modal" || mode === "theme-modal" || mode === "session-modal" || mode === "permission" || mode === "rewind-confirm";
}

export function isTextInputFocus(mode: FocusMode): boolean {
  return mode === "input" || mode === "slash";
}

export function canUseGlobalShortcut(mode: FocusMode): boolean {
  return mode === "input" || mode === "transcript-block" || mode === "tool-output";
}

export function restoreFocusAfterBlockingMode(previous: FocusMode | null | undefined): FocusMode {
  if (!previous || isModalFocus(previous) || previous === "history-search") return "input";
  return previous;
}

export function normalizeToolIndex(index: number, count: number): number {
  return normalizeBlockIndex(index, count);
}

export function moveToolIndex(index: number, count: number, direction: "next" | "previous"): number {
  return moveBlockIndex(index, count, direction);
}

export function normalizeBlockIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  if (index < 0) return count - 1;
  if (index >= count) return 0;
  return index;
}

export function moveBlockIndex(index: number, count: number, direction: "next" | "previous"): number {
  return normalizeBlockIndex(index + (direction === "next" ? 1 : -1), count);
}

export function isCtrlOInput(input: string, key: { ctrl?: boolean }): boolean {
  return key.ctrl === true && (input === "o" || input === "\u000f");
}

export function toggleExpandedToolId(expanded: Set<string>, toolKey: string | undefined): Set<string> {
  return toggleExpandedBlockId(expanded, toolKey);
}

export function toggleExpandedBlockId(expanded: Set<string>, blockKey: string | undefined): Set<string> {
  const next = new Set(expanded);
  if (!blockKey) return next;
  if (next.has(blockKey)) next.delete(blockKey);
  else next.add(blockKey);
  return next;
}

export interface CtrlOBlockToggleState {
  focusMode: FocusMode;
  selectedBlockIndex: number;
  blockKeys: string[];
  expandedBlockIds: Set<string>;
}

export function applyCtrlOBlockToggle(state: CtrlOBlockToggleState): CtrlOBlockToggleState {
  if (state.blockKeys.length === 0) return state;
  const selectedBlockIndex = Math.min(state.selectedBlockIndex, state.blockKeys.length - 1);
  const blockKey = state.blockKeys[selectedBlockIndex];
  return {
    ...state,
    focusMode: "transcript-block",
    selectedBlockIndex,
    expandedBlockIds: toggleExpandedBlockId(state.expandedBlockIds, blockKey),
  };
}

export interface CtrlOToolToggleState {
  focusMode: FocusMode;
  selectedToolIndex: number;
  toolKeys: string[];
  expandedToolIds: Set<string>;
}

export function applyCtrlOToolToggle(state: CtrlOToolToggleState): CtrlOToolToggleState {
  const next = applyCtrlOBlockToggle({
    focusMode: state.focusMode,
    selectedBlockIndex: state.selectedToolIndex,
    blockKeys: state.toolKeys,
    expandedBlockIds: state.expandedToolIds,
  });
  return {
    focusMode: next.focusMode,
    selectedToolIndex: next.selectedBlockIndex,
    toolKeys: state.toolKeys,
    expandedToolIds: next.expandedBlockIds,
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
