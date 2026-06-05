"use client";

import {
  ArrowLeftRight,
  Boxes,
  Check,
  Component,
  Copy,
  Keyboard,
  Layers,
  type LucideIcon,
  MonitorSmartphone,
  Scaling,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HeroGrid } from "./demos";
// Build-time generated (see scripts/measure-bundle.mjs + highlight-snippets.mjs).
import { BUNDLE_SIZE } from "./generated/bundle-size";
import { HERO_HEADLESS_HTML, RGL_DIFF_HTML } from "./generated/hero-code";

const INSTALL = "pnpm add @snapgridjs/react @dnd-kit/react @dnd-kit/dom";

/** The hero install command — click anywhere on it to copy — with a size breakdown. */
function InstallCommand() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="dg-install-wrap">
      <button
        type="button"
        className="dg-install"
        aria-label={copied ? "Copied install command" : "Copy install command"}
        onClick={() => {
          navigator.clipboard?.writeText(INSTALL).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            },
            () => {},
          );
        }}
      >
        <code className="dg-install__cmd">{INSTALL}</code>
        <span className="dg-install__copy" aria-hidden="true">
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </span>
      </button>
      <div className="dg-install__size">
        <span className="dg-install__size-total">≈ {BUNDLE_SIZE.total}&nbsp;kB brotli</span>
        <span className="dg-install__size-parts">
          snapgrid&nbsp;~{BUNDLE_SIZE.snapgrid}&nbsp;kB + dnd-kit&nbsp;~{BUNDLE_SIZE.dndkit}&nbsp;kB
        </span>
      </div>
    </div>
  );
}

/** The "30-second example" card — the headless API (the turnkey layer lives in the RGL comparison). */
function CodeExample() {
  return (
    <div className="dg-codecard">
      <div className="dg-codecard__bar">
        <span />
        <span />
        <span />
        <span className="dg-codecard__label">Headless</span>
      </div>
      <div
        className="dg-codecard__code"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output, fully trusted
        dangerouslySetInnerHTML={{ __html: HERO_HEADLESS_HTML }}
      />
    </div>
  );
}

/** RGL v2 → snapgrid as a unified diff — the component markup is near-identical (styling and any
 * hook usage are the real migration work; see the migration guide). */
function CompareCode() {
  return (
    <div className="dg-codecard dg-diffcard">
      <div className="dg-codecard__bar">
        <span />
        <span />
        <span />
        <span className="dg-codecard__label">react-grid-layout v2 → snapgrid</span>
      </div>
      <div
        className="dg-codecard__code"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output, fully trusted
        dangerouslySetInnerHTML={{ __html: RGL_DIFF_HTML }}
      />
    </div>
  );
}

interface Feature {
  icon: LucideIcon;
  href: string;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Component,
    href: "/docs/guides/headless",
    title: "Headless-first, dnd-kit-native",
    body: "Hooks you wire to your own markup, under your dnd-kit provider — tiles declare a group, like useSortable. <GridLayout> is the turnkey shell on top.",
  },
  {
    icon: SlidersHorizontal,
    href: "/docs/concepts",
    title: "Controlled & predictable",
    body: "You own the layout array. Every drag, resize, and cross-grid move comes back through onLayoutChange. No hidden internal state.",
  },
  {
    icon: Boxes,
    href: "/docs/guides/compaction",
    title: "Pluggable packing",
    body: "Vertical, horizontal, or free. Plus masonry, gravity, and shelf packers, or bring your own Compactor.",
  },
  {
    icon: ArrowLeftRight,
    href: "/docs/guides/cross-grid",
    title: "Cross-grid dragging",
    body: "Grids on one dnd-kit provider exchange tiles: the source loses the tile, the destination gains it — each commits its own layout.",
  },
  {
    icon: Layers,
    href: "/docs/guides/nesting",
    title: "Nested grids",
    body: "Drop a grid inside a tile of another and drag tiles between levels — or give a sub-grid its own provider to keep it contained.",
  },
  {
    icon: MonitorSmartphone,
    href: "/docs/guides/responsive",
    title: "Responsive",
    body: "Per-breakpoint layouts via the useResponsiveLayout hook, or the turnkey <ResponsiveGridLayout>.",
  },
  {
    icon: Scaling,
    href: "/docs/guides/resizing",
    title: "Resizable, with limits",
    body: "Any edge or corner, with per-item minW/maxW/minH/maxH honored and static tiles that never move.",
  },
  {
    icon: Keyboard,
    href: "/docs/guides/dragging#keyboard-accessibility",
    title: "Keyboard accessible",
    body: "Every tile is keyboard-draggable: focus, pick up with Enter, move with the arrow keys, drop or cancel with Escape. No extra wiring.",
  },
];

export function Home() {
  return (
    <div className="dg-home">
      <Link className="dg-roadmap-teaser" href="/roadmap">
        <span className="dg-roadmap-teaser__tag">Roadmap</span>
        <span className="dg-roadmap-teaser__text">
          Next: <strong>Vue, Svelte, Solid &amp; vanilla-TS</strong> bindings, and{" "}
          <strong>two-way dnd-kit interop</strong> with Droppables &amp; Sortables.
        </span>
        <span className="dg-roadmap-teaser__more">See the roadmap →</span>
      </Link>

      <section className="dg-hero">
        <div className="dg-home__lead">
          <div>
            <p className="dg-hero__eyebrow">a dnd-kit grid · react-grid-layout alternative</p>
            <h1 className="dg-hero__title">Grids that drag, resize, and repack.</h1>
            <p className="dg-hero__sub">
              A headless-first grid layout built on <strong>dnd-kit</strong> — draggable, resizable,
              repacking tiles that compose with the sortables and droppables you already have. A
              component layer makes react-grid-layout users feel right at home too.
            </p>
            <div className="dg-hero__cta">
              <Link className="dg-cta dg-cta--primary" href="/docs/getting-started">
                Get started →
              </Link>
              <Link className="dg-cta dg-cta--ghost" href="/examples">
                See examples
              </Link>
            </div>
          </div>
          <HeroGrid />
        </div>
        {/* Full-width row under both columns so the install command fits on one line. */}
        <InstallCommand />
      </section>

      <h2>Why snapgrid</h2>
      <div className="dg-features">
        {FEATURES.map(({ icon: Icon, href, title, body }) => (
          <Link className="dg-feature" key={title} href={href}>
            <span className="dg-feature__icon">
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h3>{title}</h3>
            <p>{body}</p>
            <span className="dg-feature__more">Learn more →</span>
          </Link>
        ))}
      </div>

      <h2>A 30-second example</h2>
      <CodeExample />

      <div className="dg-hero__cta" style={{ marginTop: "1.5rem" }}>
        <Link className="dg-cta dg-cta--primary" href="/docs/getting-started">
          Read the guide →
        </Link>
        <Link className="dg-cta dg-cta--ghost" href="/docs/api/overview">
          API reference
        </Link>
      </div>

      <section className="dg-compare">
        <h2>Coming from react-grid-layout?</h2>
        <p>
          The{" "}
          <strong>
            <code>{"<GridLayout>"}</code> component layer
          </strong>{" "}
          mirrors react-grid-layout v2&apos;s model — same controlled <code>layout</code>,{" "}
          <code>onLayoutChange</code>, and config objects — so RGL users adopt it quickly, then drop
          any grid down to the headless hooks at their own pace. Same engine, no second migration.
        </p>
        <CompareCode />
        <p className="dg-compare__grouplabel">Migration path</p>
        <ul className="dg-compare__list">
          <li>
            <strong>Not a literal drop-in.</strong> Same API shape, but you restyle — snapgrid ships
            no CSS and uses its own class names.
          </li>
          <li>
            <strong>v2 hooks aren&apos;t mirrored.</strong> <code>useGridLayout</code> /{" "}
            <code>useResponsiveLayout</code> code moves to the{" "}
            <Link href="/docs/guides/headless">headless API</Link>.
          </li>
          <li>
            <strong>On v1?</strong> No one-import shim — its <code>WidthProvider</code> / flat-prop
            API is dated enough that it&apos;s worth modernising. The{" "}
            <Link href="/docs/guides/migrating-from-rgl">migration guide</Link> maps it prop by
            prop.
          </li>
        </ul>
        <Link className="dg-cta dg-cta--ghost" href="/docs/guides/migrating-from-rgl">
          Full comparison &amp; migration guide →
        </Link>
      </section>
    </div>
  );
}
