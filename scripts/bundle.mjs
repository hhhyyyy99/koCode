import * as esbuild from "esbuild";
import { writeFileSync, chmodSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const entry = resolve(root, "packages/ko-cli/src/index.ts");
const outfile = resolve(root, "packages/ko-cli/bin/kocode.mjs");

// Ink lazy-loads react-devtools-core only when DEV=true, but marking it
// external hoists a static `import` to the top of the ESM bundle, so Node
// fails at startup when the package is not installed. Stub it instead.
const stubReactDevtoolsCore = {
  name: "stub-react-devtools-core",
  setup(build) {
    build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: "react-devtools-core",
      namespace: "react-devtools-core-stub",
    }));
    build.onLoad({ filter: /.*/, namespace: "react-devtools-core-stub" }, () => ({
      contents: "export default { connectToDevTools() {} };",
      loader: "js",
    }));
  },
};

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile,
  banner: {
    // CJS deps (e.g. yaml) call require() for node builtins at module init;
    // esbuild's ESM output needs a real require for those to resolve.
    js: [
      "#!/usr/bin/env node",
      'import { createRequire as __kocodeCreateRequire } from "node:module";',
      "const require = __kocodeCreateRequire(import.meta.url);",
    ].join("\n"),
  },
  external: [
    // Native modules
    "fsevents",
  ],
  plugins: [stubReactDevtoolsCore],
  alias: {
    "@kocode/ko-ai": resolve(root, "packages/ko-ai/src/index.ts"),
    "@kocode/ko-agent": resolve(root, "packages/ko-agent/src/index.ts"),
    "@kocode/ko-tui": resolve(root, "packages/ko-tui/src/index.ts"),
  },
});

chmodSync(outfile, 0o755);
console.log(`Bundle written: ${outfile}`);
