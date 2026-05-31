"use client";

import { GridLayout, type Layout, useContainerWidth } from "@snapgridjs/react";
import { useState } from "react";

export function DragHandleExample() {
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
        gridConfig={{ cols: 12, rowHeight: 52 }}
        // Only a pointer-down inside `.drag-handle` starts a drag — everything
        // else in the tile (buttons, inputs, links) stays interactive.
        dragConfig={{ handle: ".drag-handle" }}
        isResizable={false}
      >
        {layout.map((item) => (
          <div key={item.i} className="tile">
            <span className="drag-handle">⠿ {item.i}</span>
            <button type="button" onClick={() => window.alert(`clicked ${item.i}`)}>
              Click me
            </button>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
