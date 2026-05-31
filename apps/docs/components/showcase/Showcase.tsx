"use client";

import { masonryCompactor } from "@snapgrid/extras";
import {
  type Compactor,
  GridLayout,
  type ResponsiveLayouts,
  horizontalCompactor,
  useContainerWidth,
  useResponsiveLayout,
  verticalCompactor,
} from "@snapgrid/react";
import { Plus, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GridSkeleton } from "./GridSkeleton";
import { MasonryLab } from "./MasonryLab";
import { PerfLab } from "./PerfLab";
import { AvatarStack } from "./avatars";
import {
  DEFAULT_LAYOUT,
  DEFAULT_LAYOUT_MD,
  DEFAULT_LAYOUT_SM,
  DEFAULT_PANELS,
  PRESENCE,
  type Panel,
  WIDGETS,
  WIDGET_ORDER,
  type WidgetType,
} from "./widgets";

const GRID = {
  rowHeight: 64,
  margin: [14, 14] as [number, number],
  containerPadding: [0, 0] as [number, number],
};
const BREAKPOINTS = { lg: 1024, md: 640, sm: 0 };
const BP_COLS = { lg: 12, md: 8, sm: 4 };
const colsAt = (bp: string) => BP_COLS[bp as keyof typeof BP_COLS] ?? 12;
// A hand-designed layout per breakpoint, so each width looks intentional.
const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: DEFAULT_LAYOUT,
  md: DEFAULT_LAYOUT_MD,
  sm: DEFAULT_LAYOUT_SM,
};
const STORAGE_KEY = "snapgrid:showcase:v5";
const PACKERS: Record<string, Compactor> = {
  vertical: verticalCompactor,
  horizontal: horizontalCompactor,
  masonry: masonryCompactor,
};

// Each view is its own route (own URL + SEO), navigated via the tab bar.
// Dashboard lives at the bare /showcase index; the others are sub-routes.
const TABS = [
  { view: "dashboard", label: "Dashboard", href: "/showcase" },
  { view: "performance", label: "Performance", href: "/showcase/performance" },
  { view: "gallery", label: "Gallery", href: "/showcase/gallery" },
] as const;
type View = (typeof TABS)[number]["view"];

export function Showcase({ view = "dashboard" }: { view?: View }) {
  // The whole lab — header included — renders server-side; only each lab's grid
  // is client-gated (it drives dnd-kit / measured width / localStorage). So a
  // tab navigation paints the header instantly and just the tiles fill in.
  return (
    <div className="sg-showcase">
      <nav className="sg-showcase__tabs" aria-label="Showcase view">
        {TABS.map((t) => (
          <Link
            key={t.view}
            href={t.href}
            className="sg-stab"
            data-active={view === t.view || undefined}
            aria-current={view === t.view ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {view === "dashboard" ? <Dashboard /> : view === "performance" ? <PerfLab /> : <MasonryLab />}
    </div>
  );
}

function Dashboard() {
  const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 1100 });
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(DEFAULT_LAYOUTS);
  const [panels, setPanels] = useState<Panel[]>(DEFAULT_PANELS);
  const [packer, setPacker] = useState("vertical");
  const [menuOpen, setMenuOpen] = useState(false);
  const nextId = useRef(Date.now());

  // Resolve the active breakpoint, its column count, and its layout from the
  // measured width; commits write back into the per-breakpoint map.
  const { breakpoint, cols, layout, onLayoutChange } = useResponsiveLayout({
    width,
    layouts,
    breakpoints: BREAKPOINTS,
    cols: BP_COLS,
    compactor: PACKERS[packer],
    onLayoutChange: (_layout, all) => setLayouts(all),
  });

  // Hydrate the saved layouts once on mount (kept out of render so SSR/first
  // paint match; unknown widget types are dropped defensively).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { layouts?: ResponsiveLayouts; panels?: Panel[] };
      const validPanels = (saved.panels ?? []).filter((p) => WIDGETS[p.type]);
      const ids = new Set(validPanels.map((p) => p.i));
      // Start from the designed defaults so a saved blob that is missing a
      // breakpoint keeps that breakpoint's hand-authored layout (rather than
      // regenerating it from the widest one); saved breakpoints override.
      const validLayouts: ResponsiveLayouts = {};
      for (const [bp, items] of Object.entries({ ...DEFAULT_LAYOUTS, ...saved.layouts })) {
        validLayouts[bp] = (items ?? []).filter((it) => ids.has(it.i));
      }
      if (validPanels.length && Object.keys(saved.layouts ?? {}).length) {
        setPanels(validPanels);
        setLayouts(validLayouts);
      }
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  // Persist on change — but skip the first run so the initial DEFAULT closure
  // can't overwrite saved storage before the hydrate effect's state commits.
  const persistReady = useRef(false);
  useEffect(() => {
    if (!persistReady.current) {
      persistReady.current = true;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ layouts, panels }));
    } catch {
      /* storage may be unavailable */
    }
  }, [layouts, panels]);

  const panelById = new Map(panels.map((p) => [p.i, p]));

  // Add/remove operate across every materialized breakpoint; breakpoints not yet
  // materialized regenerate from the widest one (which carries the change).
  const addWidget = (type: WidgetType) => {
    const def = WIDGETS[type];
    const i = `${type}-${nextId.current++}`;
    setPanels((p) => [...p, { i, type }]);
    setLayouts((prev) => {
      const next: ResponsiveLayouts = {};
      for (const [bp, items] of Object.entries(prev)) {
        const c = colsAt(bp);
        const list = items ?? [];
        const y = list.reduce((m, it) => Math.max(m, it.y + it.h), 0);
        next[bp] = [
          ...list,
          {
            i,
            x: 0,
            y,
            w: Math.min(def.w, c),
            h: def.h,
            minW: Math.min(def.minW, c),
            minH: def.minH,
          },
        ];
      }
      return next;
    });
    setMenuOpen(false);
  };

  const removeWidget = (i: string) => {
    setPanels((p) => p.filter((x) => x.i !== i));
    setLayouts((prev) => {
      const next: ResponsiveLayouts = {};
      for (const [bp, items] of Object.entries(prev))
        next[bp] = (items ?? []).filter((x) => x.i !== i);
      return next;
    });
  };

  const reset = () => {
    setPanels(DEFAULT_PANELS);
    setLayouts(DEFAULT_LAYOUTS);
    setPacker("vertical");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  };

  const changePacker = (name: string) => {
    setPacker(name);
    setLayouts((prev) => {
      const next: ResponsiveLayouts = {};
      for (const [bp, items] of Object.entries(prev)) {
        next[bp] = PACKERS[name]?.compact(items ?? [], colsAt(bp)) ?? items;
      }
      return next;
    });
  };

  return (
    <div className="sg-dash">
      <header className="sg-dash__bar">
        <div>
          <div className="sg-dash__titlerow">
            <h1 className="sg-dash__title">Analytics</h1>
            <AvatarStack seeds={PRESENCE} max={4} size={26} />
            <span className="sg-bp" title={`${breakpoint} breakpoint`}>
              {cols} cols
            </span>
          </div>
          <p className="sg-dash__sub">
            A responsive dashboard built with snapgrid. Drag by a card's header, resize from the
            corner, add or remove widgets. Narrow the window and it reflows. Your layout is saved to
            this browser.
          </p>
        </div>
        <div className="sg-dash__tools">
          <fieldset className="sg-seg" aria-label="Packing">
            {Object.keys(PACKERS).map((name) => (
              <button
                type="button"
                key={name}
                className="sg-seg__btn"
                data-active={packer === name || undefined}
                onClick={() => changePacker(name)}
              >
                {name}
              </button>
            ))}
          </fieldset>
          <div className="sg-menu">
            <button type="button" className="sg-btn-solid" onClick={() => setMenuOpen((o) => !o)}>
              <Plus size={15} /> Add widget
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="sg-menu__backdrop"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="sg-menu__list">
                  {WIDGET_ORDER.map((t) => (
                    <button
                      type="button"
                      key={t}
                      className="sg-menu__item"
                      onClick={() => addWidget(t)}
                    >
                      {WIDGETS[t].title}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <button type="button" className="sg-btn-ghost" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </header>

      <div ref={containerRef}>
        {mounted ? (
          <GridLayout
            layout={layout}
            width={width}
            onLayoutChange={onLayoutChange}
            gridConfig={{ ...GRID, cols }}
            compactor={PACKERS[packer]}
            dragConfig={{ handle: ".sg-widget__head", cancel: ".sg-widget__x", threshold: 4 }}
            resizeConfig={{ handles: ["se"] }}
          >
            {layout.map((item) => {
              const panel = panelById.get(item.i);
              const def = panel ? WIDGETS[panel.type] : null;
              return (
                <div key={item.i} className="sg-widget">
                  <div className="sg-widget__head">
                    <span className="sg-widget__grip" aria-hidden="true">
                      ⠿
                    </span>
                    <span className="sg-widget__title">{def?.title ?? item.i}</span>
                    <button
                      type="button"
                      className="sg-widget__x"
                      aria-label={`Remove ${def?.title ?? item.i}`}
                      onClick={() => removeWidget(item.i)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="sg-widget__body">{def?.render()}</div>
                </div>
              );
            })}
          </GridLayout>
        ) : (
          <GridSkeleton
            items={layout}
            cols={cols}
            gap={GRID.margin[0]}
            rowHeight={GRID.rowHeight}
          />
        )}
      </div>

      <p className="sg-dash__credit">
        Avatars generated with{" "}
        <a href="https://www.dicebear.com/styles/lorelei/" target="_blank" rel="noreferrer">
          DiceBear’s Lorelei
        </a>{" "}
        by Lisa Wischofsky, licensed{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        .
      </p>
    </div>
  );
}
