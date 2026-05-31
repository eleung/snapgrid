"use client";

import { GridLayout, type Layout, useContainerWidth } from "@snapgridjs/react";
import { useState } from "react";

// The "404" is a snapgrid: the digits are draggable tiles. The nav tiles are
// `static` — pinned, so they read as buttons (clickable, not draggable) and the
// digits flow around them. Point the links wherever your app lives.
const SITE = "https://snapgrid.dev";

const DIGITS = [
  { i: "4a", x: 0, y: 0, w: 3, h: 3, label: "4" },
  { i: "0", x: 3, y: 0, w: 3, h: 3, label: "0", accent: true },
  { i: "4b", x: 6, y: 0, w: 3, h: 3, label: "4" },
];
const LINKS = [
  {
    i: "home",
    x: 9,
    y: 0,
    w: 3,
    h: 1,
    static: true,
    label: "Home",
    href: `${SITE}/`,
    primary: true,
  },
  {
    i: "docs",
    x: 9,
    y: 1,
    w: 3,
    h: 1,
    static: true,
    label: "Docs",
    href: `${SITE}/docs/getting-started`,
  },
  {
    i: "examples",
    x: 9,
    y: 2,
    w: 3,
    h: 1,
    static: true,
    label: "Examples",
    href: `${SITE}/examples`,
  },
];

export function NotFoundExample() {
  const { width, mounted, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([...DIGITS, ...LINKS]);

  // Render the grid only once the container has been measured. Until then
  // `useContainerWidth` reports its 1280px default, so rendering immediately
  // would lay the "404" out at full width and visibly reflow down to the narrow
  // frame on mount. The ref stays mounted so the measurement can happen.
  return (
    <div ref={containerRef}>
      {mounted ? (
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={{ cols: 12, rowHeight: 52, margin: [10, 10], containerPadding: [0, 0] }}
          isResizable={false}
        >
          {DIGITS.map((d) => (
            <div key={d.i} className={d.accent ? "cell cell--accent" : "cell"}>
              {d.label}
            </div>
          ))}
          {LINKS.map((l) => (
            <a key={l.i} href={l.href} className={l.primary ? "btn btn--primary" : "btn"}>
              {l.label}
            </a>
          ))}
        </GridLayout>
      ) : null}
    </div>
  );
}
