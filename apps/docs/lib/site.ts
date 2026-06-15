import type { Metadata } from "next";

// Single source of truth for the public origin. The site is served from the
// snapgrid.dev apex (no basePath); change SITE here to re-point canonical/OG URLs.
export const SITE = "https://snapgrid.dev";
export const GITHUB = "https://github.com/eleung/snapgrid";
export const DESCRIPTION =
  "A react-grid-layout v2 alternative built on dnd-kit. Draggable, resizable, responsive grid layouts with cross-grid dragging and pluggable packing.";
export const OG_IMAGE = "/og.png";
export const OG_ALT = "snapgrid: draggable grid layouts that drag between grids";
// Declared once so the OG/Twitter image (with alt) stays consistent across the
// layout defaults, per-page metadata, and the homepage.
export const OG_IMAGES = [
  { url: OG_IMAGE, width: 1200, height: 630, alt: OG_ALT, type: "image/png" },
];
export const TWITTER_IMAGES = [{ url: OG_IMAGE, alt: OG_ALT }];
// Keyword-rich homepage title (also the layout's `title.default`).
export const HOME_TITLE = "snapgrid — react-grid-layout alternative on dnd-kit";

function withTrailingSlash(path: string): string {
  if (path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

// Per-page SEO: canonical + OG/Twitter with a faithful per-page URL and title,
// layered over the layout's site-wide defaults. Next replaces (not deep-merges)
// nested `openGraph`/`twitter` per route, so each is re-specified in full. The
// document <title> uses the layout's "%s — snapgrid" template; OG/Twitter titles
// get the suffix applied here because metadata templates don't reach them.
export function pageMetadata(opts: {
  path: string;
  title?: string;
  description?: string;
}): Metadata {
  const description = opts.description || DESCRIPTION;
  const canonical = withTrailingSlash(opts.path);
  const ogTitle = opts.title ? `${opts.title} — snapgrid` : undefined;
  return {
    ...(opts.title ? { title: opts.title } : {}),
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "snapgrid",
      url: canonical,
      description,
      ...(ogTitle ? { title: ogTitle } : {}),
      images: OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      description,
      ...(ogTitle ? { title: ogTitle } : {}),
      images: TWITTER_IMAGES,
    },
  };
}
