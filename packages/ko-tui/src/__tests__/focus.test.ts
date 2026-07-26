import { describe, expect, it } from "vitest";
import {
  applyCtrlOBlockToggle,
  bareEscapeAction,
  busySubmitMessage,
  canUseGlobalShortcut,
  isBareEscapeInput,
  isCtrlOInput,
  isModalFocus,
  isTextInputFocus,
  moveBlockIndex,
  normalizeBlockIndex,
  restoreFocusAfterBlockingMode,
  toggleExpandedBlockId,
} from "../focus.js";

describe("focus routing helpers", () => {
  it("identifies blocking modal focus modes", () => {
    expect(isModalFocus("permission")).toBe(true);
    expect(isModalFocus("rewind-confirm")).toBe(true);
    expect(isModalFocus("status-modal")).toBe(true);
    expect(isModalFocus("input")).toBe(false);
  });

  it("blocks global shortcuts while a modal is focused", () => {
    expect(canUseGlobalShortcut("input")).toBe(true);
    expect(canUseGlobalShortcut("transcript-block")).toBe(true);
    expect(canUseGlobalShortcut("permission")).toBe(false);
    expect(canUseGlobalShortcut("rewind-confirm")).toBe(false);
    expect(canUseGlobalShortcut("slash")).toBe(false);
    expect(canUseGlobalShortcut("file-picker")).toBe(false);
    expect(canUseGlobalShortcut("history-search")).toBe(false);
  });

  it("keeps text editing active for file-picker focus", () => {
    expect(isTextInputFocus("file-picker")).toBe(true);
    expect(isModalFocus("file-picker")).toBe(false);
  });

  it("bare Esc cancels only under input focus while running", () => {
    expect(bareEscapeAction("input", true)).toBe("cancel-turn");
    expect(bareEscapeAction("input", false)).toBe("rewind-or-ignore");
    expect(bareEscapeAction("slash", true)).toBe("ignore");
    expect(bareEscapeAction("slash", false)).toBe("ignore");
    expect(bareEscapeAction("file-picker", true)).toBe("ignore");
    expect(bareEscapeAction("file-picker", false)).toBe("ignore");
    expect(bareEscapeAction("permission", true)).toBe("ignore");
    expect(bareEscapeAction("transcript-block", true)).toBe("ignore");
    expect(bareEscapeAction("history-search", true)).toBe("ignore");
  });

  it("restores a usable focus mode after blocking flows", () => {
    expect(restoreFocusAfterBlockingMode("slash")).toBe("slash");
    expect(restoreFocusAfterBlockingMode("permission")).toBe("input");
    expect(restoreFocusAfterBlockingMode("rewind-confirm")).toBe("input");
    expect(restoreFocusAfterBlockingMode("history-search")).toBe("input");
    expect(restoreFocusAfterBlockingMode("file-picker")).toBe("input");
    expect(restoreFocusAfterBlockingMode(null)).toBe("input");
  });

  it("wraps transcript block focus indexes", () => {
    expect(normalizeBlockIndex(3, 3)).toBe(0);
    expect(normalizeBlockIndex(-1, 3)).toBe(2);
    expect(moveBlockIndex(2, 3, "next")).toBe(0);
    expect(moveBlockIndex(0, 3, "previous")).toBe(2);
  });

  it("recognizes Ctrl+O from Ink and raw control input", () => {
    expect(isCtrlOInput("o", { ctrl: true })).toBe(true);
    expect(isCtrlOInput("\u000f", { ctrl: true })).toBe(true);
    expect(isCtrlOInput("o", { ctrl: false })).toBe(false);
    expect(isCtrlOInput("\u000f", { ctrl: false })).toBe(false);
  });

  it("enters transcript-block focus and toggles on the first Ctrl+O action", () => {
    const next = applyCtrlOBlockToggle({
      focusMode: "input",
      selectedBlockIndex: 1,
      blockKeys: ["thinking-a", "tool-b"],
      expandedBlockIds: new Set(),
    });

    expect(next.focusMode).toBe("transcript-block");
    expect(next.selectedBlockIndex).toBe(1);
    expect(next.expandedBlockIds.has("tool-b")).toBe(true);
  });

  it("collapses an expanded focused transcript block on Ctrl+O", () => {
    const next = applyCtrlOBlockToggle({
      focusMode: "transcript-block",
      selectedBlockIndex: 0,
      blockKeys: ["thinking-a"],
      expandedBlockIds: new Set(["thinking-a"]),
    });

    expect(next.expandedBlockIds.has("thinking-a")).toBe(false);
  });

  it("preserves tool-card keys under the generic block toggle model", () => {
    const expanded = toggleExpandedBlockId(new Set(["thinking-a"]), "0:0:tool-call_0");

    expect(expanded.has("thinking-a")).toBe(true);
    expect(expanded.has("0:0:tool-call_0")).toBe(true);
  });

  it("identifies bare escape input without matching escape sequences", () => {
    expect(isBareEscapeInput("\x1b")).toBe(true);
    expect(isBareEscapeInput("\x1b\x1b")).toBe(true);
    expect(isBareEscapeInput("\x1bq")).toBe(false);
    expect(isBareEscapeInput("\x1b[Z")).toBe(false);
    expect(isBareEscapeInput("\x1b[A")).toBe(false);
  });

  it("uses a non-destructive busy submit message", () => {
    expect(busySubmitMessage("next prompt")).toContain("draft kept");
    expect(busySubmitMessage("   ")).toBe("Agent is still running.");
  });
});
