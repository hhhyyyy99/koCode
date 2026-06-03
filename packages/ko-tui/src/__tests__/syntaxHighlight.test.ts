import { describe, it, expect } from "vitest";
import { tokenize, LANG } from "../syntaxHighlight.js";

describe("tokenize", () => {
  it("tokenizes Python keywords", () => {
    const tokens = tokenize("def foo():", "python");
    const keywords = tokens.filter((t) => t.type === "keyword");
    expect(keywords.map((t) => t.text)).toContain("def");
  });

  it("tokenizes Python strings", () => {
    const tokens = tokenize('x = "hello world"', "python");
    const strings = tokens.filter((t) => t.type === "string");
    expect(strings.length).toBeGreaterThan(0);
    expect(strings[0]!.text).toBe('"hello world"');
  });

  it("tokenizes Python comments", () => {
    const tokens = tokenize("# this is a comment", "python");
    const comments = tokens.filter((t) => t.type === "comment");
    expect(comments.length).toBe(1);
  });

  it("tokenizes TypeScript keywords and strings", () => {
    const tokens = tokenize("const x: string = 'hello';", "typescript");
    const keywords = tokens.filter((t) => t.type === "keyword");
    const strings = tokens.filter((t) => t.type === "string");
    expect(keywords.map((t) => t.text)).toContain("const");
    expect(strings.length).toBeGreaterThan(0);
  });

  it("falls back to plain for unsupported languages", () => {
    const tokens = tokenize("some code", "unknownlang");
    expect(tokens.length).toBe(1);
    expect(tokens[0]!.type).toBe("plain");
    expect(tokens[0]!.text).toBe("some code");
  });

  it("tokenizes Go keywords", () => {
    const tokens = tokenize("func main() {", "go");
    const keywords = tokens.filter((t) => t.type === "keyword");
    expect(keywords.map((t) => t.text)).toContain("func");
  });

  it("tokenizes Rust keywords", () => {
    const tokens = tokenize("fn main() {", "rust");
    const keywords = tokens.filter((t) => t.type === "keyword");
    expect(keywords.map((t) => t.text)).toContain("fn");
  });

  it("tokenizes Bash keywords", () => {
    const tokens = tokenize("if [ -f file ]; then", "bash");
    const keywords = tokens.filter((t) => t.type === "keyword");
    expect(keywords.map((t) => t.text)).toContain("if");
  });

  it("tokenizes JavaScript block comments", () => {
    const tokens = tokenize("/* block comment */", "javascript");
    const comments = tokens.filter((t) => t.type === "comment");
    expect(comments.length).toBe(1);
    expect(comments[0]!.text).toBe("/* block comment */");
  });

  it("LANG config has all 6 supported languages", () => {
    expect(Object.keys(LANG)).toContain("python");
    expect(Object.keys(LANG)).toContain("typescript");
    expect(Object.keys(LANG)).toContain("javascript");
    expect(Object.keys(LANG)).toContain("go");
    expect(Object.keys(LANG)).toContain("rust");
    expect(Object.keys(LANG)).toContain("bash");
  });

  it("tokenizes numbers", () => {
    const tokens = tokenize("x = 42", "python");
    const numbers = tokens.filter((t) => t.type === "number");
    expect(numbers.length).toBe(1);
    expect(numbers[0]!.text).toBe("42");
  });
});
