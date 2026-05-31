"use client";

import { GridLayout, type Layout, useContainerWidth } from "@snapgrid/react";
import { useState } from "react";

export function StaticItemExample() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 3, h: 2 },
    // `static: true` pins this item — it never moves, and others flow around it.
    { i: "pinned", x: 3, y: 0, w: 3, h: 2, static: true },
    { i: "b", x: 6, y: 0, w: 3, h: 2 },
    { i: "c", x: 9, y: 0, w: 3, h: 2 },
  ]);

  return (
    <div ref={containerRef}>
      <GridLayout
        layout={layout}
        width={width}
        onLayoutChange={setLayout}
        gridConfig={{ cols: 12, rowHeight: 52 }}
      >
        {layout.map((item) => (
          <div key={item.i} className="tile">
            <span className="tile__id">{item.i}</span>
            <span className="tile__dim">
              {item.w}×{item.h}
            </span>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
