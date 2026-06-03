import { describe, expect, it } from "vitest";
import {
  classifyToolPermission,
  describeToolPermission,
  permissionDecisionForTool,
  permissionRequestToolType,
  shouldRequestToolPermission,
} from "../tool-permissions.js";

describe("tool permission taxonomy", () => {
  it("classifies built-in tools by effect", () => {
    for (const name of ["ls", "read", "grep", "find"]) {
      expect(classifyToolPermission(name)).toBe("read");
    }
    expect(classifyToolPermission("write")).toBe("write");
    expect(classifyToolPermission("edit")).toBe("edit");
    expect(classifyToolPermission("bash")).toBe("bash");
    expect(classifyToolPermission("custom_tool")).toBe("unknown");
  });

  it("does not create permission request types for read-only tools", () => {
    expect(permissionRequestToolType("read")).toBeNull();
    expect(permissionRequestToolType("write")).toBe("write");
    expect(permissionRequestToolType("unknown")).toBe("unknown");
  });

  it("allows read-only tools without permission in default mode", () => {
    expect(shouldRequestToolPermission("read", "default")).toBe(false);
    expect(shouldRequestToolPermission("read", "accept_edits")).toBe(false);
  });

  it("keeps mutating and command tools gated in default mode", () => {
    expect(shouldRequestToolPermission("write", "default")).toBe(true);
    expect(shouldRequestToolPermission("edit", "default")).toBe(true);
    expect(shouldRequestToolPermission("bash", "default")).toBe(true);
    expect(shouldRequestToolPermission("unknown", "default")).toBe(true);
  });

  it("preserves accept_edits and auto behavior", () => {
    expect(shouldRequestToolPermission("write", "accept_edits")).toBe(false);
    expect(shouldRequestToolPermission("edit", "accept_edits")).toBe(false);
    expect(shouldRequestToolPermission("bash", "accept_edits")).toBe(true);
    expect(shouldRequestToolPermission("unknown", "accept_edits")).toBe(true);
    expect(shouldRequestToolPermission("bash", "auto")).toBe(false);
  });

  it("describes permissions using category-specific input", () => {
    expect(describeToolPermission("bash", { command: "ls" })).toBe("ls");
    expect(describeToolPermission("write", { file_path: "a.txt" })).toBe("a.txt");
    expect(describeToolPermission("unknown", { value: 1 })).toBe('{"value":1}');
  });

  it("returns no permission request for read-only tool decisions", () => {
    for (const name of ["ls", "read", "grep", "find"]) {
      const decision = permissionDecisionForTool(name, { path: "." }, "default");
      expect(decision.category).toBe("read");
      expect(decision.needsPermission).toBe(false);
      expect(decision.requestToolType).toBeNull();
    }
  });

  it("returns classified permission request types for gated tool decisions", () => {
    expect(permissionDecisionForTool("write", { file_path: "a" }, "default").requestToolType).toBe("write");
    expect(permissionDecisionForTool("edit", { file_path: "a" }, "default").requestToolType).toBe("edit");
    expect(permissionDecisionForTool("bash", { command: "ls" }, "default").requestToolType).toBe("bash");
    expect(permissionDecisionForTool("custom_tool", {}, "default").requestToolType).toBe("unknown");
  });

});
