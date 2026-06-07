import * as esbuild from "esbuild";
import { writeFileSync, chmodSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const entry = resolve(root, "packages/ko-cli/src/index.ts");
const outfile = resolve(root, "packages/ko-cli/bin/kocode.mjs");

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile,
  banner: {
    js: "#!/usr/bin/env node",
  },
  external: [
    // Native modules
    "fsevents",
    // Optional Ink peer dependency loaded only when DEV=true.
    "react-devtools-core",
  ],
  alias: {
    "@kocode/ko-ai": resolve(root, "packages/ko-ai/src/index.ts"),
    "@kocode/ko-agent": resolve(root, "packages/ko-agent/src/index.ts"),
    "@kocode/ko-tui": resolve(root, "packages/ko-tui/src/index.ts"),
  },
});

chmodSync(outfile, 0o755);
console.log(`Bundle written: ${outfile}`);
