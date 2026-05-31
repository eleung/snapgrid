import { DemoFrame } from "@/components/DemoFrame";
import { NotFoundExample } from "@/components/examples/NotFoundExample";
import { EXAMPLE_CODE } from "@/components/generated/example-code";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import Link from "next/link";

// Bare 404 (App Router's global not-found → 404.html in the static export). It
// sits outside the (site) route group, so it renders with NO docs chrome (no
// navbar/sidebar/footer) — the old theme:{ layout:"raw" }. It brings its own
// next-themes provider for dark mode, since the root layout has none.
export const metadata: Metadata = {
  // Plain string → the layout template makes it "404 — snapgrid" (avoid a
  // `{ absolute }` object, which Nextra's pageMap can't render).
  title: "404",
  description: "This page wandered off the grid.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <main className="dg-404">
        <div className="dg-404__inner">
          <Link href="/" className="dg-404__brand" aria-label="snapgrid home">
            <span className="dg-logo__mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="dg-logo__word">snapgrid</span>
          </Link>

          <DemoFrame
            title="Page not found"
            hint="drag the tiles"
            stageMinHeight={208}
            code={EXAMPLE_CODE.notFound}
          >
            <NotFoundExample />
          </DemoFrame>

          <p className="dg-404__lead">
            This page wandered off the grid. Drag the tiles, or click one to find your way back.
          </p>
        </div>
      </main>
    </ThemeProvider>
  );
}
