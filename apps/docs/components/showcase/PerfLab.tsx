"use client";

import { DragDropProvider } from "@dnd-kit/react";
import {
  type Compactor,
  type Layout,
  type LayoutItem,
  horizontalCompactor,
  useContainerWidth,
  useGridContainer,
  useGridItem,
  useGridPlaceholder,
  verticalCompactor,
} from "@snapgridjs/react";
import { useEffect, useState } from "react";
import { GridSkeleton } from "./GridSkeleton";
import { avatarPng, avatarUri } from "./avatars";

// The page is a smoothness-at-scale demo: drag/repack hundreds of tiles and
// watch the frame rate hold. Orientation just picks the packing direction so the
// re-pack is visible. (The fast-vs-standard speedup story lives in the compaction
// guide — it's a bulk-compaction property you can't feel while dragging.)
type Orient = "v" | "h";
const ORIENTS: Record<Orient, { label: string; compactor: Compactor }> = {
  v: { label: "Vertical", compactor: verticalCompactor },
  h: { label: "Horizontal", compactor: horizontalCompactor },
};
const ORIENT_ORDER: Orient[] = ["v", "h"];
const COUNTS = [100, 300, 600];
const MARGIN = 8;
const POOL = 30; // unique avatars; reused across all tiles so the browser decodes only POOL images
const SEEDS = Array.from({ length: POOL }, (_, i) => `perf-${i * 53 + 7}`);
// Pick an avatar by the tile's stable id (ids are `p<n>`), not its position in
// the layout array — the array re-sorts on drop/compaction, so an index-based
// seed would reshuffle every avatar from the moved tile onward.
const seedFor = (id: string) => SEEDS[(Number.parseInt(id.slice(1), 10) || 0) % POOL];

// Columns adapt to the available width (responsive): fewer, larger cells on a
// phone, up to 24 on a wide screen. Discrete steps (not a continuous formula) so
// the layout only re-generates when the width crosses a breakpoint, not on every
// resize pixel — and tiles stay ~square at a comfortable size across the range.
const COL_STEPS: ReadonlyArray<readonly [number, number]> = [
  [1000, 24],
  [760, 18],
  [520, 12],
  [0, 8],
];
function colsForWidth(w: number): number {
  for (const [min, cols] of COL_STEPS) if (w >= min) return cols;
  return 8;
}
const INITIAL_COLS = colsForWidth(1100); // matches useContainerWidth's initialWidth below

// Deterministic PRNG so a given tile count always yields the same layout — no
// hydration mismatch, and orientation switches re-pack the same set of tiles.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mostly 1×1, some 2×2, the occasional 3×3 — always square so avatars stay
// circular. Mixed sizes give the compactor a real packing problem, so switching
// orientation visibly re-packs (uniform 1×1 tiles look identical however packed).
const SIZE_WEIGHTS = [1, 1, 1, 1, 1, 1, 1, 2, 2, 3];

function genLayout(n: number, cols: number): Layout {
  const rand = mulberry32(n * 0x9e3779b1);
  const out: LayoutItem[] = [];
  // Row (shelf) placement: fill a row left-to-right, wrap when the next tile
  // won't fit, and set the row height to its tallest tile. Short tiles in a tall
  // row leave vertical slack — so vertical compaction (gravity up) and horizontal
  // compaction (gravity left) resolve it into visibly different packings.
  let x = 0;
  let shelfY = 0;
  let shelfH = 0;
  for (let i = 0; i < n; i++) {
    const s = Math.min(SIZE_WEIGHTS[Math.floor(rand() * SIZE_WEIGHTS.length)], cols);
    if (x + s > cols) {
      x = 0;
      shelfY += shelfH;
      shelfH = 0;
    }
    out.push({ i: `p${i}`, x, y: shelfY, w: s, h: s });
    x += s;
    shelfH = Math.max(shelfH, s);
  }
  return out;
}

export function PerfLab() {
  const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 1100 });
  const cols = colsForWidth(width);
  const [count, setCount] = useState(300);
  const [orient, setOrient] = useState<Orient>("v");
  const [layout, setLayout] = useState<Layout>(() =>
    verticalCompactor.compact(genLayout(300, INITIAL_COLS), INITIAL_COLS),
  );
  const [fps, setFps] = useState(60);
  // Pre-rasterize the avatar pool to PNG bitmaps once. Inline SVGs get
  // re-rastered by Safari every time a tile moves; PNGs just composite. Falls
  // back to the SVG URI until the (near-instant) rasterization resolves.
  const [pngs, setPngs] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(SEEDS.map(async (s) => [s, await avatarPng(s)] as const)).then((pairs) => {
      if (alive) setPngs(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Regenerate + compact when the tile count, orientation, OR the responsive
  // column count changes, so switching direction (or crossing a width breakpoint)
  // re-packs the same set of tiles for the new orientation/width.
  useEffect(() => {
    setLayout(ORIENTS[orient].compactor.compact(genLayout(count, cols), cols));
  }, [count, orient, cols]);

  // Live fps meter — the page's one honest, per-machine signal that it stays smooth.
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      frames++;
      if (t - last >= 500) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Square tiles: derive rowHeight from the same column-width formula the grid
  // uses (containerPadding is [0,0] here), so circular avatars never get cropped
  // to a wide aspect — they're 1×1 cells that read as people, not squished ovals.
  const rowHeight = Math.max(12, Math.round((width - MARGIN * (cols - 1)) / cols));

  return (
    <div className="sg-perf">
      <header className="sg-dash__bar">
        <div>
          <div className="sg-dash__titlerow">
            <h1 className="sg-dash__title">Compaction lab</h1>
            <span className="sg-bp" title="Live frame rate">
              {fps} fps
            </span>
          </div>
          <p className="sg-dash__sub">
            The same grid engine, under load. Drag any avatar and it repacks live, switch direction,
            and scale to 600 tiles. The frame rate holds whether you're moving a handful or
            hundreds.
          </p>
        </div>
        <div className="sg-dash__tools">
          <span className="sg-perf__ctl">Tiles</span>
          <fieldset className="sg-seg" aria-label="Tile count">
            {COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                className="sg-seg__btn"
                data-active={count === n || undefined}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </fieldset>
          <fieldset className="sg-seg" aria-label="Compactor orientation">
            {ORIENT_ORDER.map((k) => (
              <button
                key={k}
                type="button"
                className="sg-seg__btn"
                data-active={orient === k || undefined}
                onClick={() => setOrient(k)}
              >
                {ORIENTS[k].label}
              </button>
            ))}
          </fieldset>
        </div>
      </header>

      <div className="sg-perf__stage">
        {/* Measure the inner canvas, not the padded/bordered stage — getBoundingClientRect
            is border-box, so measuring the stage would over-count by its padding + border
            and the rightmost column would overflow (clipping avatars on the right). */}
        <div ref={containerRef} className="sg-perf__canvas">
          {mounted ? (
            // Headless: a dnd-kit DragDropProvider wrapping the grid host (PerfGrid),
            // exactly the pattern the docs teach — no turnkey <GridLayout>.
            <DragDropProvider>
              <PerfGrid
                layout={layout}
                width={width}
                cols={cols}
                rowHeight={rowHeight}
                compactor={ORIENTS[orient].compactor}
                onLayoutChange={setLayout}
                pngs={pngs}
              />
            </DragDropProvider>
          ) : (
            <GridSkeleton
              items={layout.slice(0, 150)}
              cols={cols}
              gap={MARGIN}
              rowHeight={rowHeight}
              circle
            />
          )}
        </div>
      </div>

      <p className="sg-perf__credit">
        Compaction runs on{" "}
        <a
          href="https://github.com/react-grid-layout/react-grid-layout"
          target="_blank"
          rel="noreferrer"
        >
          react-grid-layout
        </a>
        ’s core packing. For very large grids, snapgrid also ships drop-in O(n&nbsp;log&nbsp;n){" "}
        <a href="/docs/guides/compaction#fast-compactors">fast compactors</a>. Avatars generated
        with{" "}
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

// The grid host — rendered inside PerfLab's DragDropProvider so useGridContainer
// resolves the right manager. Owns the surface, the avatar tiles, and the landing
// placeholder. Re-renders each drag frame (its auto-height tracks the preview),
// which re-renders the tiles — exactly what the turnkey <GridLayout> does, so the
// headless port carries the same per-frame cost this demo is built to stress.
function PerfGrid({
  layout,
  width,
  cols,
  rowHeight,
  compactor,
  onLayoutChange,
  pngs,
}: {
  layout: Layout;
  width: number;
  cols: number;
  rowHeight: number;
  compactor: Compactor;
  onLayoutChange: (next: Layout) => void;
  pngs: Record<string, string>;
}) {
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    compactor,
    gridConfig: { cols, rowHeight, margin: [MARGIN, MARGIN], containerPadding: [0, 0] },
    isResizable: false,
  });
  const placeholder = useGridPlaceholder(group);
  return (
    <div {...containerProps}>
      {layout.map((it) => {
        const seed = seedFor(it.i);
        return <PerfTile key={it.i} id={it.i} group={group} src={pngs[seed] ?? avatarUri(seed)} />;
      })}
      {placeholder && (
        <div
          style={{
            ...placeholder.style,
            // Circular to echo the avatars it marks the landing cell for.
            borderRadius: "50%",
            background: "var(--dg-accent-soft)",
            border: "1px dashed var(--dg-accent)",
          }}
        />
      )}
    </div>
  );
}

// One positioned avatar tile: useGridItem supplies the ref + transform style; the
// `.sg-perf__tile` content fills it and floats itself while dragging.
function PerfTile({ id, group, src }: { id: string; group: string; src: string }) {
  const { ref, style } = useGridItem(id, group);
  return (
    <div ref={ref} style={style} className="sg-perf__tile">
      <img src={src} alt="" loading="lazy" />
    </div>
  );
}
