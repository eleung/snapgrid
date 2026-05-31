"use client";

import { ResponsiveGridLayout, type ResponsiveLayouts, useContainerWidth } from "@snapgridjs/react";
import { useState } from "react";

// Provide a layout for your widest breakpoint; snapgrid generates the narrower
// ones from it (override any by adding more keys). Default breakpoints/cols are
// lg/md/sm/xs/xxs — see the Responsive guide.
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
