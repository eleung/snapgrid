import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineWorkspace } from "vitest/config";

const coreSrc = fileURLToPath(new URL("./packages/grid-core/src/index.ts", import.meta.url));
const dndSrc = fileURLToPath(new URL("./packages/grid-dnd/src/index.ts", import.meta.url));

// Core: pure layout adapter, node environment.
// dnd: framework-agnostic engine (jsdom — collision/sensors touch the DOM).
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
      name: "dnd",
      root: "./packages/grid-dnd",
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./vitest.setup.ts"],
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
      // Run React tests against the live core + engine source, not their dist.
      alias: { "@snapgridjs/core": coreSrc, "@snapgridjs/dnd": dndSrc },
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
    // Svelte binding: factories/components, jsdom environment. Runs against the
    // live core + engine source (like the React project), with the Svelte compiler.
    plugins: [svelte(), svelteTesting()],
    resolve: {
      alias: { "@snapgridjs/core": coreSrc, "@snapgridjs/dnd": dndSrc },
      // Resolve the `svelte` export condition of @dnd-kit/svelte (uncompiled runes
      // modules) so the Svelte compiler processes them.
      conditions: ["svelte", "browser"],
    },
    test: {
      name: "svelte",
      root: "./packages/grid-svelte",
      environment: "jsdom",
      include: ["src/**/*.test.{ts,svelte.ts}"],
      setupFiles: ["./vitest.setup.ts"],
      // @dnd-kit/svelte ships uncompiled .svelte / .svelte.js runes modules; inline
      // it so the Svelte compiler processes them instead of Node choking on ".svelte".
      server: { deps: { inline: [/@dnd-kit\/svelte/] } },
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
