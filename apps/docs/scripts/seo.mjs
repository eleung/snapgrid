// Generates public/sitemap.xml, robots.txt, and site.webmanifest from the page
// routes. Runs in `prebuild` so the files land in the static export (out/).
// These are pure build artifacts (no source imports them) — gitignored.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, "..", "content");
const publicDir = join(here, "..", "public");

// Canonical public URL. Served from the snapgrid.dev apex (no subpath). Override
// for a different host: DOCS_SITE_URL=https://example.com
const SITE = (process.env.DOCS_SITE_URL ?? "https://snapgrid.dev").replace(/\/+$/, "");
// Match next.config's basePath (DOCS_BASE_PATH), falling back to SITE's pathname,
// so the manifest start_url/icon paths can't disagree with how the app is served.
const BASE_PATH = (process.env.DOCS_BASE_PATH ?? new URL(SITE).pathname).replace(/\/+$/, "");
const DESCRIPTION =
  "A react-grid-layout v2 alternative built on dnd-kit, for React and Svelte. Draggable, resizable grid layouts with cross-grid dragging and pluggable packing.";

// Walk content/ for .mdx/.md content files → { route, lastmod }.
function collect(dir, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collect(full, `${prefix}/${entry.name}`));
    } else if (/\.mdx?$/.test(entry.name)) {
      const base = entry.name.replace(/\.mdx?$/, "");
      const route = base === "index" ? prefix || "/" : `${prefix}/${base}`;
      out.push({ route, lastmod: statSync(full).mtime.toISOString().slice(0, 10) });
    }
  }
  return out;
}

const pages = collect(contentDir).sort((a, b) => a.route.localeCompare(b.route));

// trailingSlash: true → every URL ends in "/".
const loc = (route) => `${SITE}${route === "/" ? "/" : `${route}/`}`;
const priority = (route) => (route === "/" ? "1.0" : route.split("/").length <= 2 ? "0.8" : "0.6");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) =>
      `  <url>\n    <loc>${loc(p.route)}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority(p.route)}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;
writeFileSync(join(publicDir, "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
writeFileSync(join(publicDir, "robots.txt"), robots);

const manifest = {
  name: "snapgrid",
  short_name: "snapgrid",
  description: DESCRIPTION,
  start_url: `${BASE_PATH}/`,
  scope: `${BASE_PATH}/`,
  display: "standalone",
  background_color: "#faf8f4",
  theme_color: "#d97757",
  icons: [
    { src: `${BASE_PATH}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
    { src: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
    { src: `${BASE_PATH}/favicon.svg`, type: "image/svg+xml", purpose: "any" },
  ],
};
writeFileSync(join(publicDir, "site.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`seo: sitemap.xml (${pages.length} urls), robots.txt, site.webmanifest → public/`);
