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
import { type KeyboardEvent as ReactKeyboardEvent, useRef, useState } from "react";
import { HeroGrid } from "./demos";
// Build-time generated (see scripts/measure-bundle.mjs + highlight-snippets.mjs).
import { BUNDLE_SIZE } from "./generated/bundle-size";
import { HERO_DROPIN_HTML, HERO_HEADLESS_HTML } from "./generated/hero-code";

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

const CODE_TABS = [
  { key: "dropin", label: "Drop-in", html: HERO_DROPIN_HTML },
  { key: "headless", label: "Headless", html: HERO_HEADLESS_HTML },
] as const;

/** The "30-second example" card, toggling between the drop-in and headless APIs. */
function CodeExample() {
  const [tab, setTab] = useState<(typeof CODE_TABS)[number]["key"]>("dropin");
  const active = CODE_TABS.find((t) => t.key === tab) ?? CODE_TABS[0];
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // WAI-ARIA tabs: arrow keys move between tabs (roving tabindex) and focus follows.
  const onTabKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = CODE_TABS.findIndex((t) => t.key === tab);
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % CODE_TABS.length
        : e.key === "ArrowLeft"
          ? (i - 1 + CODE_TABS.length) % CODE_TABS.length
          : -1;
    if (next < 0) return;
    e.preventDefault();
    const key = CODE_TABS[next].key;
    setTab(key);
    tabRefs.current[key]?.focus();
  };

  return (
    <div className="dg-codecard">
      <div className="dg-codecard__bar">
        <span />
        <span />
        <span />
        <div
          className="dg-codetabs"
          role="tablist"
          aria-label="Example style"
          onKeyDown={onTabKeyDown}
        >
          {CODE_TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              id={`code-tab-${t.key}`}
              role="tab"
              aria-selected={tab === t.key}
              aria-controls="code-tabpanel"
              tabIndex={tab === t.key ? 0 : -1}
              ref={(el) => {
                tabRefs.current[t.key] = el;
              }}
              className="dg-codetab"
              data-active={tab === t.key || undefined}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div
        id="code-tabpanel"
        role="tabpanel"
        aria-labelledby={`code-tab-${active.key}`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a tabpanel must be focusable when its content (a code block) isn't
        tabIndex={0}
        className="dg-codecard__code"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output, fully trusted
        dangerouslySetInnerHTML={{ __html: active.html }}
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
    icon: SlidersHorizontal,
    href: "/docs/concepts",
    title: "Controlled & predictable",
    body: "You own the layout array. Every drag, resize, and cross-grid move comes back through onLayoutChange. No hidden internal state.",
  },
  {
    icon: Component,
    href: "/docs/guides/headless",
    title: "Headless or drop-in",
    body: "Use <GridLayout> for the common case, or compose SnapGridProvider + hooks and render your own markup. No imposed DOM or CSS.",
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
    body: "Wrap grids in a <SnapGridGroup> and drag tiles between them. The source loses the tile; the destination gains it.",
  },
  {
    icon: Layers,
    href: "/docs/guides/nesting",
    title: "Nested grids",
    body: "Drop a grid inside a tile of another grid. Standalone providers keep each level isolated: drag the panel, or rearrange what's inside it.",
  },
  {
    icon: MonitorSmartphone,
    href: "/docs/guides/responsive",
    title: "Responsive",
    body: "Per-breakpoint layouts with <ResponsiveGridLayout>; missing breakpoints are generated from the nearest one.",
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
            <p className="dg-hero__eyebrow">react-grid-layout alternative · dnd-kit powered</p>
            <h1 className="dg-hero__title">Grids that drag, resize, and repack.</h1>
            <p className="dg-hero__sub">
              A controlled, headless-first grid layout for React: draggable and resizable tiles,
              pluggable packing, responsive breakpoints, and dragging tiles <em>between</em> grids.
              Built on dnd-kit.
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

      <section className="dg-compare">
        <h2>Coming from react-grid-layout?</h2>
        <p>
          snapgrid keeps everything you rely on in RGL — the same controlled layout model,{" "}
          <code>onLayoutChange</code>, responsive breakpoints, resize limits, and static tiles — and
          adds cross-grid dragging, nested grids, a headless mode, and keyboard-accessible dragging.
          The real difference is the engine underneath: snapgrid runs on <strong>dnd-kit</strong>,
          the de-facto standard for drag-and-drop in React.
        </p>
        <ul className="dg-compare__list">
          <li>
            <strong>Already using dnd-kit?</strong> snapgrid slots into your existing interaction
            layer, and adds only its own ~{BUNDLE_SIZE.snapgrid}&nbsp;kB on top of the dnd-kit you
            already ship.
          </li>
          <li>
            <strong>Accessibility RGL lacks.</strong> dnd-kit gives every tile keyboard dragging and
            screen-reader support out of the box; react-draggable / react-resizable don't.
          </li>
          <li>
            <strong>Modern, maintained input.</strong> One pointer · touch · keyboard sensor model
            instead of RGL's older handlers.
          </li>
        </ul>
        <Link className="dg-cta dg-cta--ghost" href="/docs/guides/migrating-from-rgl">
          Full comparison &amp; migration guide →
        </Link>
      </section>

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
    </div>
  );
}
