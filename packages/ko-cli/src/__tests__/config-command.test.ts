import { describe, it, expect } from "vitest";
import {
  validateConfig,
  configGet,
  configSet,
  configUnset,
  defaultConfigTemplate,
} from "../config-command";

describe("validateConfig", () => {
  it("accepts empty config", () => {
    expect(validateConfig({})).toEqual([]);
  });

  it("rejects non-object config", () => {
    const errors = validateConfig("not an object");
    expect(errors.length).toBeGreaterThan(0);
  });

  it("validates provider structure", () => {
    const errors = validateConfig({
      providers: { x: { } },
    });
    expect(errors.some((e) => e.path === "providers.x.apiKey")).toBe(true);
  });

  it("validates model cost type", () => {
    const errors = validateConfig({
      providers: {
        x: {
          apiKey: "sk-xxx",
          models: { m1: { cost: "not-an-object" } },
        },
      },
    });
    expect(errors.some((e) => e.path.includes("models.m1.cost"))).toBe(true);
  });

  it("validates default provider exists", () => {
    const errors = validateConfig({
      providers: {},  // providers exist but "missing" is not there
      default: { provider: "missing", model: "x" },
    });
    expect(errors.some((e) => e.path === "default.provider")).toBe(true);
  });

  it("accepts valid config", () => {
    const errors = validateConfig({
      providers: {
        anthropic: { apiKey: "sk-xxx" },
      },
      default: { provider: "anthropic", model: "claude-sonnet-4-5-20250514" },
    });
    expect(errors).toEqual([]);
  });
});

describe("configGet", () => {
  it("reads nested values", () => {
    const cfg = { providers: { a: { apiKey: "secret" } } };
    expect(configGet(cfg, "providers.a.apiKey")).toBe("secret");
  });

  it("returns undefined for missing keys", () => {
    expect(configGet({}, "a.b.c")).toBeUndefined();
  });
});

describe("configSet", () => {
  it("sets nested values creating intermediate objects", () => {
    const cfg: any = {};
    configSet(cfg, "providers.a.apiKey", "sk-xxx");
    expect(cfg.providers.a.apiKey).toBe("sk-xxx");
  });
});

describe("configUnset", () => {
  it("removes existing keys", () => {
    const cfg: any = { a: { b: 1 } };
    expect(configUnset(cfg, "a.b")).toBe(true);
    expect(cfg.a.b).toBeUndefined();
  });

  it("returns false for missing keys", () => {
    expect(configUnset({}, "a.b")).toBe(false);
  });
});

describe("defaultConfigTemplate", () => {
  it("returns a YAML template string", () => {
    const tpl = defaultConfigTemplate();
    expect(tpl).toContain("# koCode configuration");
    expect(tpl).toContain("providers:");
  });
});
