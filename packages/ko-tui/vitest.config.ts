import { resolveTsPlugin } from "../../vitest-plugin.js";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [resolveTsPlugin()],
  test: {
    environment: "node",
    env: {
      KOCODE_SESSIONS_DIR: "/tmp/kocode-vitest-sessions",
    },
    include: ["src/__tests__/**/*.test.ts"],
  },
});
