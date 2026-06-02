"use client";

import { GridLayout, type Layout, useContainerWidth } from "@snapgridjs/react";
import { useState } from "react";

// The turnkey layer. <GridLayout> mints its own DragDropProvider and renders the
// tiles, resize handles, placeholder, and drag overlay for you — so there's no
// dnd-kit wiring and no per-tile hooks. Children are keyed by their item's `i`.
export function ComponentLayerExample() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
  ]);
  return (
    <div ref={containerRef}>
      <GridLayout
        layout={layout}
        width={width}
        onLayoutChange={setLayout}
        gridConfig={{ rowHeight: 80 }}
        resizeConfig={{ handles: ["se"] }}
      >
        {layout.map((it) => (
          <div key={it.i} className="tile">
            {it.i}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
