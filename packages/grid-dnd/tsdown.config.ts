import { defineConfig } from "tsdown";

// @snapgridjs/core and the @dnd-kit packages (peers) are declared dependencies,
// so tsdown externalizes them automatically — this package ships only its own code.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
});
