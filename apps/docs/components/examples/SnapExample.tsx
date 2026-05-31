"use client";

import { GridLayout, type Layout, useContainerWidth } from "@snapgrid/react";
import { useState } from "react";

export function SnapExample() {
  const { width, containerRef } = useContainerWidth();
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
    { i: "d", x: 0, y: 2, w: 6, h: 2 },
  ]);

  return (
    <div>
      <div className="controls">
        <button
          type="button"
          data-active={!snapToGrid || undefined}
          onClick={() => setSnapToGrid(false)}
        >
          glide (default)
        </button>
        <button
          type="button"
          data-active={snapToGrid || undefined}
          onClick={() => setSnapToGrid(true)}
        >
          snapToGrid
        </button>
      </div>
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={{ cols: 12, rowHeight: 52 }}
          dragConfig={{ snapToGrid }}
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
    </div>
  );
}
