"use client";

import { masonryCompactor } from "@snapgrid/extras";
import { GridLayout, type Layout, useContainerWidth } from "@snapgrid/react";
import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { GridSkeleton } from "./GridSkeleton";

// Generated, offline "content" cards: varied heights + a hue per card, so the
// masonry has a real packing problem and reads like a moodboard — no external
// images. A small rowHeight keeps the heights looking continuous (not steppy).
// Each card carries a title + a line of copy, shown in a caption below the
// gradient like a Pinterest pin.
const CARDS = [
  { label: "Sunset", blurb: "Warm gradients for the slow golden hour" },
  { label: "Harbor", blurb: "Calm blues along a quiet morning waterfront" },
  { label: "Forest", blurb: "Layered greens and dappled afternoon light" },
  { label: "Bloom", blurb: "Soft petals opening in early spring" },
  { label: "Dunes", blurb: "Wind-carved sand under a wide midday sky" },
  { label: "Tide", blurb: "Where the cool surf meets the open shore" },
  { label: "Ember", blurb: "The last warm glow of a low fire" },
  { label: "Frost", blurb: "Pale light over still water at dawn" },
  { label: "Meadow", blurb: "Open grass running out to the horizon" },
  { label: "Cliff", blurb: "Steep weathered rock above a grey sea" },
  { label: "Aurora", blurb: "Ribbons of cold light across the dark" },
  { label: "Coast", blurb: "A long horizon with salt in the air" },
  { label: "Drift", blurb: "Slow clouds on a lazy afternoon" },
  { label: "Glow", blurb: "Lamplight pooling on warm worn wood" },
  { label: "Haze", blurb: "Distant hills lost to the summer heat" },
  { label: "Moss", blurb: "Damp green spreading over old stone" },
  { label: "Slate", blurb: "Cool even greys just after the rain" },
  { label: "Lagoon", blurb: "Still turquoise held behind the reef" },
  { label: "Wisp", blurb: "A thin trail of cloud at late dusk" },
  { label: "Zephyr", blurb: "A light breeze through the tall grass" },
];
const HEIGHTS = [20, 28, 24, 36, 18, 30, 26, 38, 22, 32];
const PINS = CARDS.map((c, i) => ({
  id: `p${i}`,
  h: HEIGHTS[i % HEIGHTS.length],
  hue: (i * 47) % 360,
  label: c.label,
  blurb: c.blurb,
}));
const BASE: Layout = PINS.map((p, i) => ({ i: p.id, x: 0, y: i, w: 1, h: p.h }));

const ROW = 8;
const colsAt = (w: number) => (w < 520 ? 2 : w < 720 ? 3 : w < 960 ? 4 : 5);
const gradient = (hue: number) =>
  `linear-gradient(155deg, hsl(${hue} 58% 74%), hsl(${(hue + 38) % 360} 52% 56%))`;

export function MasonryLab() {
  const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 1100 });
  const cols = colsAt(width);
  const [layout, setLayout] = useState<Layout>(() => masonryCompactor.compact(BASE, 5));

  // Re-pack into the new column count whenever the responsive breakpoint changes.
  useEffect(() => {
    setLayout((l) => masonryCompactor.compact(l, cols));
  }, [cols]);

  // Reshuffle reading order, then let masonry re-pack — a quick way to see it work.
  // masonryCompactor sorts incoming items by row/col, so shuffling the array alone
  // is a no-op; we reassign a fresh top-to-bottom order (x:0, y:index) so the new
  // reading order actually sticks before compacting.
  const shuffle = () =>
    setLayout((l) => {
      const reordered = [...l]
        .sort(() => Math.random() - 0.5)
        .map((it, idx) => ({ ...it, x: 0, y: idx }));
      return masonryCompactor.compact(reordered, cols);
    });

  return (
    <div className="sg-pins">
      <header className="sg-dash__bar">
        <div>
          <div className="sg-dash__titlerow">
            <h1 className="sg-dash__title">Moodboard</h1>
            <span className="sg-bp" title="Live column count">
              {cols} cols
            </span>
          </div>
          <p className="sg-dash__sub">
            A Pinterest-style masonry, packed by the masonry compactor. Drag a card to reorder and
            the columns reflow; narrow the window and the column count adapts. Heights vary, gaps
            don't.
          </p>
        </div>
        <div className="sg-dash__tools">
          <button type="button" className="sg-btn-ghost" onClick={shuffle}>
            <Shuffle size={14} /> Shuffle
          </button>
        </div>
      </header>

      <div ref={containerRef} className="sg-pins__stage">
        {mounted ? (
          <GridLayout
            layout={layout}
            width={width}
            onLayoutChange={setLayout}
            gridConfig={{ cols, rowHeight: ROW, margin: [12, 12], containerPadding: [0, 0] }}
            compactor={masonryCompactor}
            isResizable={false}
          >
            {PINS.map((p) => (
              <div key={p.id} className="sg-pin">
                <div className="sg-pin__media" style={{ background: gradient(p.hue) }} />
                <div className="sg-pin__body">
                  <span className="sg-pin__title">{p.label}</span>
                  <span className="sg-pin__desc">{p.blurb}</span>
                </div>
              </div>
            ))}
          </GridLayout>
        ) : (
          <GridSkeleton items={layout} cols={cols} gap={12} rowHeight={ROW} />
        )}
      </div>
    </div>
  );
}
