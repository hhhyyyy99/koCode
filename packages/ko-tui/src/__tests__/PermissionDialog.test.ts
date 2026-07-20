import { describe, expect, it } from "vitest";
import {
  permissionDialogOptions,
  permissionDialogTitle,
  permissionPreviewLines,
} from "../PermissionDialog.js";

describe("PermissionDialog semantics", () => {
  it("maps known permission types to accurate titles", () => {
    expect(permissionDialogTitle("write")).toBe("Create file");
    expect(permissionDialogTitle("edit")).toBe("Edit file");
    expect(permissionDialogTitle("bash")).toBe("Bash command");
  });

  it("does not render unknown tools as Create file", () => {
    expect(permissionDialogTitle("unknown")).toBe("Tool permission");
  });

  it("uses category-specific allow-all wording", () => {
    const bashAllowAll = permissionDialogOptions("bash", "ls -la", "/", "bash")[1]!;
    expect(bashAllowAll.toLowerCase()).toContain("session");
    expect(bashAllowAll.toLowerCase()).not.toContain("project");
    expect(bashAllowAll.toLowerCase()).not.toContain("always allow");
    expect(permissionDialogOptions("write", undefined, "/tmp", "write")[1]).toContain("all edits");
    expect(permissionDialogOptions("edit", undefined, "/tmp", "edit")[1]).toContain("all edits");
    expect(permissionDialogOptions("unknown", undefined, "/", "custom_tool")[1]).toContain("custom_tool");
    expect(permissionDialogOptions("unknown", undefined, "/", "custom_tool")[1]).not.toContain("file changes");
  });

  it("previews bash commands", () => {
    expect(permissionPreviewLines("bash", { command: "pwd" })).toEqual(["pwd"]);
  });

  it("previews write content with line boundaries", () => {
    expect(permissionPreviewLines("write", { content: "one\ntwo" })).toEqual(["one", "two"]);
    expect(permissionPreviewLines("write", { content: "one\ntwo\n" })).toEqual(["one", "two"]);
  });

  it("previews edit replacement content before old content", () => {
    expect(permissionPreviewLines("edit", { old_string: "old", new_string: "new" })).toEqual(["new"]);
  });
});
