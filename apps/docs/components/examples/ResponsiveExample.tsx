"use client";

import { DragDropProvider } from "@dnd-kit/react";
import {
  type Layout,
  type ResponsiveLayouts,
  useContainerWidth,
  useGridContainer,
  useGridItem,
  useResponsiveLayout,
} from "@snapgridjs/react";
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
  // Resolve the active breakpoint's column count + layout from the measured width.
  const { layout, cols, onLayoutChange } = useResponsiveLayout({
    width,
    layouts,
    onLayoutChange: (_active, all) => setLayouts(all),
  });
  return (
    <div ref={containerRef}>
      <DragDropProvider>
        <Grid layout={layout} width={width} cols={cols} onLayoutChange={onLayoutChange} />
      </DragDropProvider>
    </div>
  );
}

function Grid({
  layout,
  width,
  cols,
  onLayoutChange,
}: {
  layout: Layout;
  width: number;
  cols: number;
  onLayoutChange: (next: Layout) => void;
}) {
  // The column count tracks the active breakpoint, so the grid reflows with it.
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    gridConfig: { cols, rowHeight: 48 },
  });
  return (
    <div {...containerProps}>
      {layout.map((it) => (
        <Tile key={it.i} id={it.i} group={group} />
      ))}
    </div>
  );
}

function Tile({ id, group }: { id: string; group: string }) {
  const { ref, style } = useGridItem(id, group);
  return (
    <div ref={ref} style={style} className="tile">
      {id}
    </div>
  );
}
