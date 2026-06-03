import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Vite plugin to resolve .js → .ts for vitest
export function resolveTsPlugin() {
  return {
    name: "resolve-ts",
    enforce: "pre" as const,
    resolveId(source: string, importer: string | undefined) {
      if (!importer) return null;
      const base = dirname(importer);
      const full = resolve(base, source);

      // .js extension → .ts
      if (source.endsWith(".js")) {
        const ts = full.replace(/\.js$/, ".ts");
        if (existsSync(ts)) return ts;
      }

      // extensionless → .ts
      if (!source.includes(".")) {
        if (existsSync(full + ".ts")) return full + ".ts";
      }

      return null;
    },
  };
}
