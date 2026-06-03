import { describe, expect, it } from "vitest";
import { getBuiltinThemes, getTheme } from "../theme.js";
import { getThemeOptions } from "../ThemePanel.js";

describe("theme catalogue", () => {
  it("includes the selector options required by the theme spec", () => {
    expect(getThemeOptions().map((option) => option.label)).toEqual([
      "Auto (match terminal)",
      "Dark mode",
      "Light mode",
      "Dark mode (colorblind-friendly)",
      "Light mode (colorblind-friendly)",
      "Dark mode (ANSI colors only)",
      "Light mode (ANSI colors only)",
    ]);
  });

  it("resolves every selector option to a theme", () => {
    for (const option of getThemeOptions()) {
      expect(getTheme(option.name)).toBeDefined();
    }
  });

  it("keeps legacy ansi command alias available", () => {
    expect(getBuiltinThemes().map((theme) => theme.name)).toContain("ansi");
  });
});
