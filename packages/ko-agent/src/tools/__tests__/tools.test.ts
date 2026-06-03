import { describe, it, expect, beforeEach } from "vitest";
import {
  readTool,
  writeTool,
  editTool,
  bashTool,
  setBashPolicy,
  setPermissionChecker,
  getDefaultTools,
} from "../index.js";

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import * as os from "node:os";

const tmpDir = join(os.tmpdir(), "kocode-test-" + Date.now());

beforeEach(() => {
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
});

describe("readTool", () => {
  it("reads a file with line numbers", async () => {
    const filePath = join(tmpDir, "test.txt");
    writeFileSync(filePath, "line 1\nline 2\nline 3", "utf-8");
    const result = await readTool.execute({ file_path: filePath }, tmpDir);
    expect(result.isError).toBe(false);
    expect(result.content).toContain("1\tline 1");
    expect(result.content).toContain("3\tline 3");
    unlinkSync(filePath);
  });

  it("returns error for non-existent file", async () => {
    const result = await readTool.execute({ file_path: join(tmpDir, "does-not-exist") }, tmpDir);
    expect(result.isError).toBe(true);
  });

  it("validates required parameters", async () => {
    const result = await readTool.execute({}, tmpDir);
    expect(result.isError).toBe(true);
    expect(result.content).toContain("Missing required parameter");
  });
});

describe("writeTool", () => {
  it("creates a new file", async () => {
    const filePath = join(tmpDir, "new-file.txt");
    const result = await writeTool.execute({ file_path: filePath, content: "hello" }, tmpDir);
    expect(result.isError).toBe(false);
    expect(existsSync(filePath)).toBe(true);
    unlinkSync(filePath);
  });
});

describe("editTool", () => {
  it("replaces text in a file", async () => {
    const filePath = join(tmpDir, "edit-test.txt");
    writeFileSync(filePath, "hello world", "utf-8");
    const result = await editTool.execute(
      { file_path: filePath, old_string: "hello", new_string: "hi" },
      tmpDir,
    );
    expect(result.isError).toBe(false);
    expect(readFileSync(filePath, "utf-8")).toBe("hi world");
    unlinkSync(filePath);
  });

  it("rejects when old_string not found", async () => {
    const filePath = join(tmpDir, "edit-test2.txt");
    writeFileSync(filePath, "abc", "utf-8");
    const result = await editTool.execute(
      { file_path: filePath, old_string: "xyz", new_string: "q" },
      tmpDir,
    );
    expect(result.isError).toBe(true);
    expect(result.content).toContain("String not found");
    unlinkSync(filePath);
  });
});

describe("bashTool", () => {
  it("executes a simple command", async () => {
    const result = await bashTool.execute({ command: "echo hello" }, tmpDir);
    expect(result.isError).toBe(false);
    expect(result.content.trim()).toBe("hello");
  });

  it("blocks dangerous commands", async () => {
    const result = await bashTool.execute({ command: "rm -rf /" }, tmpDir);
    expect(result.isError).toBe(true);
    expect(result.content).toContain("Dangerous command");
  });

  it("respects whitelist", async () => {
    setBashPolicy({ allow: ["echo"] });
    const result = await bashTool.execute({ command: "echo allowed" }, tmpDir);
    expect(result.isError).toBe(false);
    setBashPolicy({});
  });
});

describe("path sandbox", () => {
  it("prevents path traversal", async () => {
    const result = await readTool.execute({ file_path: "../../etc/passwd" }, tmpDir);
    expect(result.isError).toBe(true);
    expect(result.content).toContain("Path traversal");
  });
});

describe("getDefaultTools", () => {
  it("returns 7 tools", () => {
    const tools = getDefaultTools();
    expect(tools.length).toBe(7);
    expect(tools.map((t) => t.name).sort()).toEqual(
      ["bash", "edit", "find", "grep", "ls", "read", "write"].sort(),
    );
  });
});

describe("validation", () => {
  it("validates parameter types", async () => {
    const result = await readTool.execute({ file_path: 123, offset: "abc" }, tmpDir);
    expect(result.isError).toBe(true);
  });
});

describe("permission checker", () => {
  it("blocks when checker returns false", async () => {
    setPermissionChecker(async () => false);
    const result = await writeTool.execute({ file_path: join(tmpDir, "x"), content: "y" }, tmpDir);
    expect(result.isError).toBe(true);
    expect(result.content).toContain("Permission denied");
    setPermissionChecker(null);
  });
});
