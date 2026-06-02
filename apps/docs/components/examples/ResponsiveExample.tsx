"use client";

import { ResponsiveGridLayout, type ResponsiveLayouts, useContainerWidth } from "@snapgridjs/react";
import { useState } from "react";

// Give a layout for the widest breakpoint; narrower ones are generated from it.
const INITIAL: ResponsiveLayouts = {
  lg: [
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
    { i: "d", x: 0, y: 2, w: 6, h: 1 },
    { i: "e", x: 6, y: 2, w: 6, h: 1 },
  ],
};

export function ResponsiveExample() {
  const { width, containerRef } = useContainerWidth();
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(INITIAL);
  return (
    <div ref={containerRef}>
      <ResponsiveGridLayout
        width={width}
        layouts={layouts}
        onLayoutChange={(_active, all) => setLayouts(all)}
        rowHeight={48}
      >
        {["a", "b", "c", "d", "e"].map((id) => (
          <div key={id} className="tile">
            {id}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
