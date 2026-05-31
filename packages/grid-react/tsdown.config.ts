import { defineConfig } from "tsdown";

// dnd-kit packages, react/react-dom (peers) and @snapgrid/core are all declared
// dependencies, so tsdown externalizes them automatically.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
});
