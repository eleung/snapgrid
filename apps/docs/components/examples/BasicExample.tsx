"use client";

import { GridLayout, type Layout, useContainerWidth } from "@snapgrid/react";
import { useState } from "react";

export function BasicExample() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 3 },
    { i: "d", x: 0, y: 2, w: 6, h: 2 },
    { i: "e", x: 6, y: 2, w: 2, h: 2 },
  ]);

  return (
    <div ref={containerRef}>
      <GridLayout
        layout={layout}
        width={width}
        onLayoutChange={setLayout}
        gridConfig={{ cols: 12, rowHeight: 52, margin: [10, 10] }}
        resizeConfig={{ handles: ["se", "e", "s"] }}
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
