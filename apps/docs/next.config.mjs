import path from "node:path";
import { fileURLToPath } from "node:url";
import nextra from "nextra";

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
  transpilePackages: ["@snapgrid/react", "@snapgrid/core", "@snapgrid/extras"],
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  webpack: (config) => {
    // Monorepo-only dedupe of @dnd-kit/react. @snapgrid/react declares @dnd-kit/*
    // as peers (so real consumers share their single installed copy), but in this
    // workspace the package also carries them as devDeps to build standalone, so
    // pnpm gives grid-react its own symlinked copy and Next/transpilePackages
    // bundles two DragDropProvider contexts (external drops never reach the grid).
    // Forcing one path collapses them. Real consumers (npm/yarn hoist; pnpm peer
    // resolution) don't need this — it's a workspace artifact of workspace:* +
    // transpilePackages.
    config.resolve.alias["@dnd-kit/react"] = path.resolve(here, "node_modules/@dnd-kit/react");
    return config;
  },
});
