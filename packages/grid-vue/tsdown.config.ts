import { defineConfig } from "tsdown";

// dnd-kit packages, vue (peer) and @snapgridjs/core + /dnd are all declared
// dependencies, so tsdown externalizes them automatically. Components are plain
// `defineComponent` render functions, so no SFC toolchain is involved.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
});
