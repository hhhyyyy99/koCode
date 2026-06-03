import { describe, expect, it } from "vitest";
import {
  busySubmitMessage,
  canUseGlobalShortcut,
  isBareEscapeInput,
  isModalFocus,
  moveToolIndex,
  normalizeToolIndex,
  restoreFocusAfterBlockingMode,
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
    expect(canUseGlobalShortcut("tool-output")).toBe(true);
    expect(canUseGlobalShortcut("permission")).toBe(false);
    expect(canUseGlobalShortcut("rewind-confirm")).toBe(false);
    expect(canUseGlobalShortcut("slash")).toBe(false);
  });

  it("restores a usable focus mode after blocking flows", () => {
    expect(restoreFocusAfterBlockingMode("slash")).toBe("slash");
    expect(restoreFocusAfterBlockingMode("permission")).toBe("input");
    expect(restoreFocusAfterBlockingMode("rewind-confirm")).toBe("input");
    expect(restoreFocusAfterBlockingMode("history-search")).toBe("input");
    expect(restoreFocusAfterBlockingMode(null)).toBe("input");
  });

  it("wraps tool focus indexes", () => {
    expect(normalizeToolIndex(3, 3)).toBe(0);
    expect(normalizeToolIndex(-1, 3)).toBe(2);
    expect(moveToolIndex(2, 3, "next")).toBe(0);
    expect(moveToolIndex(0, 3, "previous")).toBe(2);
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
