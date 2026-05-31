import { fileURLToPath } from "node:url";
import { defineWorkspace } from "vitest/config";

const coreSrc = fileURLToPath(new URL("./packages/grid-core/src/index.ts", import.meta.url));

// Core: pure layout adapter, node environment.
// React: hooks/components, jsdom environment.
export default defineWorkspace([
  {
    test: {
      name: "core",
      root: "./packages/grid-core",
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  },
  {
    resolve: { alias: { "@snapgridjs/core": coreSrc } },
    test: {
      name: "extras",
      root: "./packages/grid-extras",
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  },
  {
    resolve: {
      // Run React tests against the live core source, not its built dist.
      alias: { "@snapgridjs/core": coreSrc },
    },
    test: {
      name: "react",
      root: "./packages/grid-react",
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./vitest.setup.ts"],
    },
  },
  {
    // Docs app: data-level guards for the showcase (layout validity, registry).
    test: {
      name: "docs",
      root: "./apps/docs",
      // jsdom: showcase data modules transitively import @snapgridjs/react.
      environment: "jsdom",
      include: ["components/**/*.test.{ts,tsx}"],
      setupFiles: ["./vitest.setup.ts"],
    },
  },
]);
