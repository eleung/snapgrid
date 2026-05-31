import { defineConfig } from "tsdown";

// `react-grid-layout` is a declared dependency, so tsdown externalizes it
// automatically — no need to list it explicitly.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
});
