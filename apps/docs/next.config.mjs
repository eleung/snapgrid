import path from "node:path";
import { fileURLToPath } from "node:url";
import nextra from "nextra";
import sveltePreprocess from "svelte-preprocess";
import { VueLoaderPlugin } from "vue-loader";

const here = path.dirname(fileURLToPath(import.meta.url));

const withNextra = nextra({
  defaultShowCopyCode: true,
  // Highlight MDX code blocks with the same dual light/dark theme the hero and
  // live-example "Code" tabs use (highlight-snippets.mjs), so all code on the
  // site shares one syntax palette. Nextra keeps its own code-block background,
  // so only the token colors change.
  mdxOptions: {
    rehypePrettyCodeOptions: {
      theme: { light: "vitesse-light", dark: "vitesse-dark" },
    },
  },
});

// Served from the snapgrid.dev apex — no path prefix. Override DOCS_BASE_PATH
// only when hosting under a subpath again (e.g. a GitHub Pages project site).
const basePath = process.env.DOCS_BASE_PATH ?? "";

export default withNextra({
  // The static export only matters for `next build`. Leaving `output: "export"`
  // on in `next dev` makes the dev server 500 every unmatched path — including
  // the 404 page itself — because an optional catch-all (`[[...mdxPath]]`) can't
  // satisfy export's "every route must be a static param" rule for the fallback.
  // Scope it to production so `next dev` serves dynamically (404s render); the
  // built output is unchanged.
  output: process.env.NODE_ENV === "development" ? undefined : "export",
  images: { unoptimized: true },
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  // The workspace packages ship built dist/, but transpiling keeps ESM/JSX
  // interop seamless when importing them into the Next build.
  transpilePackages: [
    "@snapgridjs/react",
    "@snapgridjs/core",
    "@snapgridjs/extras",
    // Svelte bindings ship uncompiled .svelte / .svelte.js — transpile them so Next
    // runs their re-exports through the svelte-loader pipeline (else re-exported
    // components resolve to `undefined` at runtime).
    "@snapgridjs/svelte",
    "@dnd-kit/svelte",
    // Vue bindings ship compiled JS (no SFCs), but transpiling keeps them on the same
    // ESM/interop path as the rest of the workspace packages.
    "@snapgridjs/vue",
    "@dnd-kit/vue",
  ],
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  webpack: (config, { dev, webpack }) => {
    // Monorepo-only dedupe of @dnd-kit/react. @snapgridjs/react declares @dnd-kit/*
    // as peers (so real consumers share their single installed copy), but in this
    // workspace the package also carries them as devDeps to build standalone, so
    // pnpm gives grid-react its own symlinked copy and Next/transpilePackages
    // bundles two DragDropProvider contexts (external drops never reach the grid).
    // Forcing one path collapses them. Real consumers (npm/yarn hoist; pnpm peer
    // resolution) don't need this — it's a workspace artifact of workspace:* +
    // transpilePackages.
    config.resolve.alias["@dnd-kit/react"] = path.resolve(here, "node_modules/@dnd-kit/react");

    // Svelte islands: the docs render Svelte demos (compiled at build time, mounted
    // client-side via <SvelteDemo>) so each binding's examples run natively. Compile
    // .svelte components + .svelte.js runes modules with svelte-loader.
    config.resolve.extensions.push(".svelte");
    config.module.rules.push(
      {
        test: /\.svelte(\.js)?$/,
        use: {
          loader: "svelte-loader",
          // svelte-preprocess handles `<script lang="ts">` (@snapgridjs/svelte and
          // @dnd-kit/svelte ship uncompiled TS); .svelte.js runes modules pass through.
          // verbatimModuleSyntax is REQUIRED so TS doesn't elide component imports used
          // only in the template (else e.g. <DragDropProvider> → undefined at runtime).
          options: {
            compilerOptions: { dev },
            emitCss: false,
            preprocess: sveltePreprocess({
              typescript: { compilerOptions: { verbatimModuleSyntax: true } },
            }),
          },
        },
      },
      // Svelte ships ESM without file extensions in some internal imports.
      { test: /node_modules[/\\]svelte[/\\].*\.m?js$/, resolve: { fullySpecified: false } },
    );

    // Vue islands: the docs render Vue demos (compiled at build time, mounted
    // client-side via <VueDemo>) so each binding's examples run natively. Unlike the
    // Svelte binding, @snapgridjs/vue ships compiled JS — this loader exists only for
    // the docs' own demo components, which are authored as real SFCs so the "Code" tab
    // shows the `<script setup>` source a Vue user would actually write.
    config.resolve.extensions.push(".vue");
    // UNSHIFT, and use the `use` form rather than the `loader:` shorthand. VueLoaderPlugin
    // scans the rules in order and stops at the FIRST one matching `foo.vue`, then looks
    // for vue-loader in that rule's `use`. Next ships an earlier catch-all rule that also
    // matches, so appending yields "No matching use for vue-loader is found".
    config.module.rules.unshift({
      test: /\.vue$/,
      use: [
        {
          loader: "vue-loader",
          options: {
            // Emit an inline matchResource (`Foo.vue.ts!=!…`) for each language block, so
            // the cloned rule hands `<script setup lang="ts">` to next-swc-loader with a
            // `.ts` extension. Without it SWC sees the `.vue` name, parses the block as
            // plain JS, and chokes on the first `import { type X }`.
            experimentalInlineMatchResource: true,
          },
        },
      ],
    });
    // VueLoaderPlugin clones every existing module rule so it also applies to the
    // matching language blocks inside an SFC. It must be added AFTER the rules above so
    // it sees them; it targets `.vue` resourceQuery blocks only, so the svelte-loader
    // rule is left alone.
    config.plugins.push(new VueLoaderPlugin());
    // Vue reads these compile-time flags; without them the runtime logs a warning about
    // "feature flags not properly configured" on every page.
    config.plugins.push(
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: "true",
        __VUE_PROD_DEVTOOLS__: "false",
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
      }),
    );
    return config;
  },
});
