import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      KOCODE_SESSIONS_DIR: "/tmp/kocode-vitest-sessions",
    },
    include: ["src/__tests__/**/*.test.ts", "src/tools/__tests__/**/*.test.ts"],
  },
});
