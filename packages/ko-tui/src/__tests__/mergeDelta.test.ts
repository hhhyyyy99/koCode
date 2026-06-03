import { describe, it, expect } from "vitest";

// Duplicate the mergeDelta for testing (matches useTurns.ts)
function mergeDelta(cur: string, delta: string): string {
  if (!cur) return delta;
  if (!delta) return cur;
  const minLen = Math.min(cur.length, delta.length);
  for (let j = minLen; j > 0; j--) {
    if (cur.endsWith(delta.slice(0, j))) {
      return cur + delta.slice(j);
    }
  }
  return cur + delta;
}

describe("mergeDelta", () => {
  it("appends incremental deltas", () => {
    expect(mergeDelta("", "你好")).toBe("你好");
    expect(mergeDelta("你好", "！")).toBe("你好！");
    expect(mergeDelta("你好！", "有什么")).toBe("你好！有什么");
  });

  it("handles full accumulated text (mimo-style)", () => {
    expect(mergeDelta("你好", "你好！")).toBe("你好！");
    expect(mergeDelta("你好！", "你好！有什么")).toBe("你好！有什么");
    expect(mergeDelta("你好！有什么", "你好！有什么我可以")).toBe("你好！有什么我可以");
  });

  it("handles partial overlap between end and start", () => {
    expect(mergeDelta("我是一个", "一个AI")).toBe("我是一个AI");
    expect(mergeDelta("你好世界", "世界你好")).toBe("你好世界你好");
  });

  it("skips exact duplicates", () => {
    expect(mergeDelta("你好", "你好")).toBe("你好");
    expect(mergeDelta("你好！有什么我可以帮你", "你好！有什么我可以帮你")).toBe("你好！有什么我可以帮你");
  });

  it("handles empty inputs", () => {
    expect(mergeDelta("", "")).toBe("");
    expect(mergeDelta("", "你好")).toBe("你好");
    expect(mergeDelta("你好", "")).toBe("你好");
  });

  it("handles english text overlap", () => {
    expect(mergeDelta("Hello", "Hello world")).toBe("Hello world");
    expect(mergeDelta("Hello world, ", "Hello world, how can I help?")).toBe("Hello world, how can I help?");
    expect(mergeDelta("I am", "am an AI")).toBe("I am an AI");
  });
});
