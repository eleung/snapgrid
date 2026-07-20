import { statSync } from "node:fs";
import { join } from "node:path";
import { VERSION } from "@/components/generated/version";
import { FRAMEWORK_IDS } from "@/lib/frameworks";
import { DESCRIPTION, GITHUB, HOME_TITLE, SITE, pageMetadata } from "@/lib/site";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateStaticParamsFor, importPage } from "nextra/pages";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

// The optional catch-all matches every path in `next dev`, so an unknown route
// reaches this page and `importPage` throws MODULE_NOT_FOUND. Translate that into
// a proper notFound() so dev renders the 404 page (instead of a 500) and matches
// the static export's behaviour. Real pages are unaffected.
async function loadPage(mdxPath: string[]) {
  try {
    return await importPage(mdxPath);
  } catch {
    notFound();
  }
}

// Framework-prefixed docs live under /<framework>/docs/** (react, svelte, …);
// showcase/roadmap/changelog stay unprefixed. A docs page is `[framework, "docs", …]`.
const FRAMEWORK_SET = new Set<string>(FRAMEWORK_IDS);
function isDocsPath(mdxPath: string[]): boolean {
  return FRAMEWORK_SET.has(mdxPath[0] ?? "") && mdxPath[1] === "docs";
}

// The framework a path belongs to, Title-cased for SEO copy, or null (unprefixed
// pages like showcase/roadmap). The /react and /svelte docs are near-identical
// content, so their titles/descriptions/structured-data carry the framework name —
// otherwise the twins are duplicate SERP entries and neither targets "react grid"
// vs "svelte grid" queries.
const FRAMEWORK_LABELS: Record<string, string> = { react: "React", svelte: "Svelte" };
function frameworkOf(mdxPath: string[]): string | null {
  const seg = mdxPath[0] ?? "";
  return FRAMEWORK_SET.has(seg) ? (FRAMEWORK_LABELS[seg] ?? seg) : null;
}

// Path-segment → breadcrumb label + landing URL, for the BreadcrumbList JSON-LD
// on docs pages. Landing URLs carry the active framework prefix. Only sections
// with a real landing page are listed (so every non-leaf crumb has a URL, as
// Google requires); `guides` has no index page and is intentionally absent — the
// page title carries that level. The framework segment itself is not a crumb.
function docsSections(framework: string): Record<string, { name: string; item: string }> {
  return {
    docs: { name: "Documentation", item: `${SITE}/${framework}/docs/getting-started/` },
    api: { name: "API", item: `${SITE}/${framework}/docs/api/overview/` },
  };
}

type PageProps = {
  params: Promise<{ mdxPath?: string[] }>;
};

function routePath(segments: string[]): string {
  return `/${segments.join("/")}`;
}

// With `trailingSlash` + `output: export`, `next dev` routes the client-side RSC
// payload request (e.g. `/docs/getting-started/index.txt`) through this catch-all
// with the `.txt` filename as an extra path segment — which would resolve to the
// not-found page and break link clicks in dev. The static export serves those
// `.txt` files directly, so it's unaffected; this guard just keeps dev navigation
// working by dropping the RSC filename segment.
function cleanSegments(mdxPath: string[]): string[] {
  return mdxPath.filter((segment) => !segment.endsWith(".txt"));
}

function titleOf(metadata: { title?: unknown }): string | undefined {
  return typeof metadata.title === "string" ? metadata.title : undefined;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { mdxPath: rawPath = [] } = await props.params;
  const mdxPath = cleanSegments(rawPath);
  // Homepage: reuse the shared per-page metadata, then force the keyword-rich
  // absolute title (the layout's "%s — snapgrid" template must not apply here; the
  // navbar/breadcrumb read the frontmatter title from the pageMap, unaffected).
  if (mdxPath.length === 0) {
    const base = pageMetadata({ path: "/" });
    return {
      ...base,
      title: { absolute: HOME_TITLE },
      openGraph: { ...base.openGraph, title: HOME_TITLE },
      twitter: { ...base.twitter, title: HOME_TITLE },
    };
  }
  const { metadata } = await loadPage(mdxPath);
  const fw = frameworkOf(mdxPath);
  const rawTitle = titleOf(metadata);
  const rawDesc = typeof metadata.description === "string" ? metadata.description : undefined;
  return pageMetadata({
    path: routePath(mdxPath),
    // Tag framework pages so the /react and /svelte twins are distinct in search:
    // "Dragging · React" / "Dragging · Svelte", and the framework keyword leads the
    // description (survives SERP truncation).
    title: fw && rawTitle ? `${rawTitle} · ${fw}` : rawTitle,
    description: fw && rawDesc ? `${fw} · ${rawDesc}` : rawDesc,
  });
}

// Stable @id anchors so the Organization/WebSite nodes can be referenced (rather
// than re-stated) from the SoftwareApplication and per-page TechArticle nodes.
const ORG_ID = `${SITE}/#organization`;
const SITE_ID = `${SITE}/#website`;

// Brand entity — feeds the knowledge graph and ties the social `sameAs` links to
// the name. Uses the 180×180 PNG as the logo (SVG logos aren't eligible).
const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: "snapgrid",
  url: `${SITE}/`,
  logo: `${SITE}/apple-touch-icon.png`,
  sameAs: [GITHUB],
};

// Site entity — lets per-page articles declare `isPartOf` the site.
const webSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": SITE_ID,
  name: "snapgrid",
  url: `${SITE}/`,
  description: DESCRIPTION,
  publisher: { "@id": ORG_ID },
};

// SoftwareApplication JSON-LD for the homepage.
const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "snapgrid",
  description: DESCRIPTION,
  url: `${SITE}/`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  softwareVersion: VERSION,
  license: "https://opensource.org/licenses/MIT",
  sameAs: [GITHUB],
  publisher: { "@id": ORG_ID },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

// Content file mtime (YYYY-MM-DD) for a route's `dateModified`, mirroring how
// scripts/seo.mjs stamps the sitemap. Best-effort: any miss just omits the date.
const CONTENT_DIR = join(process.cwd(), "content");
function lastModified(mdxPath: string[]): string | undefined {
  const rel = mdxPath.join("/");
  for (const candidate of [`${rel}.mdx`, `${rel}.md`, `${rel}/index.mdx`, `${rel}/index.md`]) {
    try {
      return statSync(join(CONTENT_DIR, candidate)).mtime.toISOString().slice(0, 10);
    } catch {
      // try the next candidate
    }
  }
  return undefined;
}

// TechArticle for docs pages — makes them eligible for richer documentation
// results, with a freshness signal and links back to the site/brand entities.
function buildArticle(
  mdxPath: string[],
  metadata: { title?: unknown; description?: unknown },
): object | null {
  if (!isDocsPath(mdxPath)) return null;
  const canonical = `${SITE}${routePath(mdxPath)}/`;
  const modified = lastModified(mdxPath);
  const fw = frameworkOf(mdxPath);
  const rawDesc = typeof metadata.description === "string" ? metadata.description : DESCRIPTION;
  const rawTitle = titleOf(metadata) || "snapgrid documentation";
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    // Framework-tagged to match the page metadata (distinct twins).
    headline: fw ? `${rawTitle} · ${fw}` : rawTitle,
    description: fw ? `${fw} · ${rawDesc}` : rawDesc,
    url: canonical,
    inLanguage: "en",
    ...(fw
      ? { keywords: `snapgrid, ${fw}, dnd-kit, grid layout, react-grid-layout alternative` }
      : {}),
    isPartOf: { "@id": SITE_ID },
    publisher: { "@id": ORG_ID },
    ...(modified ? { dateModified: modified } : {}),
  };
}

// BreadcrumbList for docs pages: snapgrid › Documentation › [API ›] Page.
function buildBreadcrumb(mdxPath: string[], metadata: { title?: unknown }): object | null {
  if (!isDocsPath(mdxPath)) return null;
  const canonical = `${SITE}${routePath(mdxPath)}/`;
  const sections = docsSections(mdxPath[0] as string);
  const crumbs: { name: string; item?: string }[] = [{ name: "snapgrid", item: `${SITE}/` }];
  for (const seg of mdxPath.slice(0, -1)) {
    if (sections[seg]) crumbs.push(sections[seg]);
  }
  crumbs.push({ name: titleOf(metadata) || "Documentation", item: canonical });
  // Drop any crumb whose URL repeats an earlier one (e.g. a section's own landing
  // page, where the section link and the leaf are the same page).
  const seen = new Set<string>();
  const trail = crumbs.filter((c) => {
    if (c.item && seen.has(c.item)) return false;
    if (c.item) seen.add(c.item);
    return true;
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.item ? { item: c.item } : {}),
    })),
  };
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props: PageProps) {
  const params = await props.params;
  const mdxPath = cleanSegments(params.mdxPath ?? []);
  const { default: MDXContent, toc, metadata, sourceCode } = await loadPage(mdxPath);
  // Homepage: SoftwareApplication + the brand/site entities. Docs pages: the
  // TechArticle and its breadcrumb. Emitted as separate <script> blocks (Google
  // reads each independently); `@id` refs tie the article back to site/org.
  const jsonLd =
    mdxPath.length === 0
      ? [softwareApplication, webSite, organization]
      : [buildArticle(mdxPath, metadata), buildBreadcrumb(mdxPath, metadata)].filter(Boolean);

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      {jsonLd.map((node, i) => (
        <script
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-order JSON-LD list, never reordered.
          key={i}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from our own constants + page path/title, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
      <MDXContent {...props} params={{ mdxPath }} />
    </Wrapper>
  );
}
