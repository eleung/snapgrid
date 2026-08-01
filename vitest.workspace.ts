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
    // Vue binding: composables/components, jsdom environment. Runs against the live
    // core + engine source (like the React project). @dnd-kit/vue ships compiled JS and
    // the binding authors components as `defineComponent` render functions, so no SFC
    // compiler or dependency inlining is needed.
    resolve: {
      alias: { "@snapgridjs/core": coreSrc, "@snapgridjs/dnd": dndSrc },
    },
    test: {
      name: "vue",
      root: "./packages/grid-vue",
      environment: "jsdom",
      include: ["src/**/*.test.ts"],
      // ssr.test.ts belongs to the `vue-ssr` project below (no DOM).
      exclude: ["**/node_modules/**", "**/dist/**", "src/__tests__/ssr.test.ts"],
      setupFiles: ["./vitest.setup.ts"],
    },
  },
  {
    // Server rendering must be exercised with NO DOM at all: under jsdom, `document` and
    // `window` exist, so a "doesn't touch the DOM on the server" assertion is
    // unenforceable and a real Nuxt SSR regression would still pass. No setup file —
    // that one pulls in @testing-library/vue and a ResizeObserver stub, both of which
    // would defeat the point.
    resolve: {
      alias: { "@snapgridjs/core": coreSrc, "@snapgridjs/dnd": dndSrc },
    },
    test: {
      name: "vue-ssr",
      root: "./packages/grid-vue",
      environment: "node",
      include: ["src/__tests__/ssr.test.ts"],
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
