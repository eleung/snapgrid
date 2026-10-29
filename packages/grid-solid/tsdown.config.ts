import { defineConfig } from "tsdown";

// dnd-kit packages, solid-js (peer) and @snapgridjs/core + /dnd are all declared
// dependencies, so tsdown externalizes them automatically. Components are plain
// `createComponent` calls (no JSX), so no Solid compiler is involved and one build serves
// both the DOM and SSR: `solid-js/web` resolves to its server build under the consumer's
// `node` condition.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
});
