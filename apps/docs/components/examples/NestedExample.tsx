"use client";

import { GridLayout, type Layout, useContainerWidth } from "@snapgrid/react";
import { useState } from "react";

// The inner grid is an ordinary, self-contained <GridLayout>; its drags stay
// isolated from the outer one.
function InnerGrid() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "1", x: 0, y: 0, w: 1, h: 1 },
    { i: "2", x: 1, y: 0, w: 1, h: 1 },
    { i: "3", x: 2, y: 0, w: 1, h: 1 },
  ]);
  return (
    <div ref={containerRef}>
      <GridLayout
        layout={layout}
        width={width}
        onLayoutChange={setLayout}
        gridConfig={{ cols: 4, rowHeight: 36 }}
        isResizable={false}
      >
        {layout.map((item) => (
          <div key={item.i} className="tile">
            {item.i}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}

export function NestedExample() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "panel", x: 0, y: 0, w: 7, h: 4 },
    { i: "a", x: 7, y: 0, w: 5, h: 2 },
    { i: "b", x: 7, y: 2, w: 5, h: 2 },
  ]);

  return (
    <div ref={containerRef}>
      <GridLayout
        layout={layout}
        width={width}
        onLayoutChange={setLayout}
        gridConfig={{ cols: 12, rowHeight: 52 }}
        // The outer panel drags only from its header, which sits OUTSIDE the
        // inner grid — so a pointer-down on an inner tile never moves the panel.
        dragConfig={{ handle: ".panel-header" }}
        isResizable={false}
      >
        {layout.map((item) =>
          item.i === "panel" ? (
            <div key={item.i} className="panel">
              <div className="panel-header">⠿ Nested board</div>
              <InnerGrid />
            </div>
          ) : (
            <div key={item.i} className="tile">
              {item.i}
            </div>
          ),
        )}
      </GridLayout>
    </div>
  );
}
