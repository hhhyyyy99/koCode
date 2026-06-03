import { resolveTsPlugin } from "../../vitest-plugin.js";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [resolveTsPlugin()],
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
  },
});
