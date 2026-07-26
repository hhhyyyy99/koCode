import { describe, expect, it } from "vitest";
import { filePickerWindow, formatFileRows } from "../FilePickerPanel.js";

describe("formatFileRows", () => {
  it("marks the selected row and shows the insertable path", () => {
    const rows = formatFileRows(
      [
        { path: "packages/", name: "packages", isDirectory: true },
        { path: "package.json", name: "package.json", isDirectory: false },
      ],
      1,
    );
    expect(rows[0]).toEqual({ key: "packages/", selected: false, line: "  packages/" });
    expect(rows[1]).toEqual({ key: "package.json", selected: true, line: "❯ package.json" });
  });
});

describe("filePickerWindow", () => {
  it("windows around the selection like the command panel", () => {
    expect(filePickerWindow(3, 0)).toEqual({ start: 0, end: 3 });
    expect(filePickerWindow(20, 0)).toEqual({ start: 0, end: 6 });
    expect(filePickerWindow(20, 10)).toEqual({ start: 7, end: 13 });
    expect(filePickerWindow(20, 19)).toEqual({ start: 14, end: 20 });
  });

  it("keeps the selected index inside the visible slice", () => {
    for (let selected = 0; selected < 20; selected++) {
      const { start, end } = filePickerWindow(20, selected);
      expect(selected).toBeGreaterThanOrEqual(start);
      expect(selected).toBeLessThan(end);
      expect(end - start).toBeLessThanOrEqual(6);
    }
  });
});
