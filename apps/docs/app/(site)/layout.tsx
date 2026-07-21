import { DraggableLogoMark } from "@/components/DraggableLogoMark";
import { FrameworkNav } from "@/components/FrameworkNav";
import { FrameworkProvider } from "@/components/FrameworkProvider";
import { FrameworkSwitcher } from "@/components/FrameworkSwitcher";
import { VERSION } from "@/components/generated/version";
import { GITHUB } from "@/lib/site";
import Link from "next/link";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import type { ReactNode } from "react";

// The site chrome: Nextra's <Layout> (navbar, sidebar, toc, footer) + its
// next-themes provider, wrapping every real page (home, showcase, docs — all
// content/ routes via the catch-all). The 404 lives outside this group, so it
// renders bare (no chrome), matching the old theme:{ layout:"raw" }.

// The switcher lives in the logo node (a segmented control next to the brand), so
// it sits with `logoLink={false}` — Nextra would otherwise wrap the whole logo in
// the home link, nesting the switcher buttons inside an <a> (invalid). The brand is
// its own link instead.
const Logo = () => (
  <span className="dg-logo">
    <Link href="/" className="dg-logo__brand" aria-label={`snapgrid v${VERSION}`}>
      <DraggableLogoMark />
      <span className="dg-logo__word">snapgrid</span>
      <span className="dg-logo__ver">v{VERSION}</span>
    </Link>
    <FrameworkSwitcher />
    {/* Framework-aware Docs + Examples links sit here — on the left, next to the
        switcher — rather than in the trailing Navbar slot. */}
    <span className="dg-navnav">
      <FrameworkNav />
    </span>
  </span>
);

// Bump `storageKey` whenever the banner message changes, so it re-shows to readers who
// dismissed the previous one.
const banner = (
  <Banner storageKey="svelte-release">
    <span>
      New — snapgrid now ships for <strong>Svelte 5</strong>: the same dnd-kit-native,
      headless-first grid — drag, resize, repack, and drag between grids.{" "}
      <Link href="/svelte/examples">See it in Svelte →</Link>
    </span>
  </Banner>
);

const navbar = <Navbar logo={<Logo />} logoLink={false} projectLink={GITHUB} />;

const footer = (
  <Footer>
    <div className="dg-footer">
      <span>
        MIT-licensed. Built on{" "}
        <a href="https://github.com/clauderic/dnd-kit" target="_blank" rel="noreferrer">
          dnd-kit
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/react-grid-layout/react-grid-layout"
          target="_blank"
          rel="noreferrer"
        >
          react-grid-layout/core
        </a>
        .
      </span>
      <span className="dg-footer__meta">© {new Date().getFullYear()} snapgrid</span>
    </div>
  </Footer>
);

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const pageMap = await getPageMap();
  return (
    <FrameworkProvider>
      <Layout
        banner={banner}
        navbar={navbar}
        footer={footer}
        pageMap={pageMap}
        docsRepositoryBase={`${GITHUB}/tree/main/apps/docs`}
        editLink="Edit this page on GitHub"
        feedback={{ content: "Question? Open an issue", labels: "documentation" }}
        sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: true }}
        toc={{ float: true }}
      >
        {children}
      </Layout>
    </FrameworkProvider>
  );
}
