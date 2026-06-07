import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      KOCODE_SESSIONS_DIR: "/tmp/kocode-vitest-sessions",
    },
    include: ["**/__tests__/**/*.test.ts"],
  },
});
