import { DraggableLogoMark } from "@/components/DraggableLogoMark";
import { VERSION } from "@/components/generated/version";
import { GITHUB } from "@/lib/site";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import type { ReactNode } from "react";

// The site chrome: Nextra's <Layout> (navbar, sidebar, toc, footer) + its
// next-themes provider, wrapping every real page (home, showcase, docs — all
// content/ routes via the catch-all). The 404 lives outside this group, so it
// renders bare (no chrome), matching the old theme:{ layout:"raw" }.

const Logo = () => (
  <span className="dg-logo" aria-label={`snapgrid v${VERSION}`}>
    <DraggableLogoMark />
    <span className="dg-logo__word">snapgrid</span>
    <span className="dg-logo__ver">v{VERSION}</span>
  </span>
);

const banner = (
  <Banner storageKey="v2-parity">
    <span>
      snapgrid is a react-grid-layout v2 alternative built on dnd-kit. Drag, resize, repack, and
      drag between grids.
    </span>
  </Banner>
);

const navbar = <Navbar logo={<Logo />} projectLink={GITHUB} />;

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
  );
}
