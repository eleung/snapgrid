"use client";

import { GridLayout, type Layout, useContainerWidth } from "@snapgridjs/react";
import { useState } from "react";

export function ResizeExample() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "min 2×1", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
    { i: "max 6×3", x: 4, y: 0, w: 4, h: 2, maxW: 6, maxH: 3 },
    { i: "free", x: 8, y: 0, w: 4, h: 2 },
  ]);

  return (
    <div ref={containerRef}>
      <GridLayout
        layout={layout}
        width={width}
        onLayoutChange={setLayout}
        gridConfig={{ cols: 12, rowHeight: 52 }}
        resizeConfig={{ handles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"] }}
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
