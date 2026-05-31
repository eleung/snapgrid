"use client";

import {
  type Compactor,
  GridLayout,
  type Layout,
  type LayoutItem,
  horizontalCompactor,
  useContainerWidth,
  verticalCompactor,
} from "@snapgrid/react";
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
const COLS = 24;
const MARGIN = 8;
const POOL = 30; // unique avatars; reused across all tiles so the browser decodes only POOL images
const SEEDS = Array.from({ length: POOL }, (_, i) => `perf-${i * 53 + 7}`);
// Pick an avatar by the tile's stable id (ids are `p<n>`), not its position in
// the layout array — the array re-sorts on drop/compaction, so an index-based
// seed would reshuffle every avatar from the moved tile onward.
const seedFor = (id: string) => SEEDS[(Number.parseInt(id.slice(1), 10) || 0) % POOL];

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

function genLayout(n: number): Layout {
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
    const s = Math.min(SIZE_WEIGHTS[Math.floor(rand() * SIZE_WEIGHTS.length)], COLS);
    if (x + s > COLS) {
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
  const [count, setCount] = useState(300);
  const [orient, setOrient] = useState<Orient>("v");
  const [layout, setLayout] = useState<Layout>(() =>
    verticalCompactor.compact(genLayout(300), COLS),
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

  // Regenerate + compact when the tile count or orientation changes, so switching
  // direction re-packs the same set of tiles in the new orientation.
  useEffect(() => {
    setLayout(ORIENTS[orient].compactor.compact(genLayout(count), COLS));
  }, [count, orient]);

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
  const rowHeight = Math.max(12, Math.round((width - MARGIN * (COLS - 1)) / COLS));

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
            <GridLayout
              layout={layout}
              width={width}
              onLayoutChange={setLayout}
              compactor={ORIENTS[orient].compactor}
              gridConfig={{
                cols: COLS,
                rowHeight,
                margin: [MARGIN, MARGIN],
                containerPadding: [0, 0],
              }}
              isResizable={false}
            >
              {layout.map((it) => {
                const seed = seedFor(it.i);
                return (
                  <div key={it.i} className="sg-perf__tile">
                    <img src={pngs[seed] ?? avatarUri(seed)} alt="" loading="lazy" />
                  </div>
                );
              })}
            </GridLayout>
          ) : (
            <GridSkeleton
              items={layout.slice(0, 150)}
              cols={COLS}
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
