"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { type Layout, useContainerWidth, useGridContainer, useGridItem } from "@snapgridjs/react";
import { useState } from "react";

export function NestedExample() {
  return (
    <DragDropProvider>
      <OuterBoard />
    </DragDropProvider>
  );
}

function OuterBoard() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "panel", x: 0, y: 0, w: 8, h: 4 },
    { i: "a", x: 8, y: 0, w: 4, h: 2 },
    { i: "b", x: 8, y: 2, w: 4, h: 2 },
  ]);
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange: setLayout,
    gridConfig: { cols: 12, rowHeight: 52 },
    isResizable: false,
  });
  return (
    <div ref={containerRef}>
      <div {...containerProps}>
        {layout.map((it) => (
          <Tile key={it.i} id={it.i} group={group} />
        ))}
      </div>
    </div>
  );
}

function Tile({ id, group }: { id: string; group: string }) {
  const { ref, handleRef, style } = useGridItem({ id, group });
  if (id === "panel") {
    // Per-tile drag handle: the panel drags only from its header, so grabbing an
    // inner tile never drags the whole panel. Using `handleRef` (not a grid-wide
    // `dragConfig.handle`) keeps the other tiles whole-tile draggable.
    return (
      <div ref={ref} style={style} className="panel">
        <div ref={handleRef} className="panel-header">
          ⠿ Nested board
        </div>
        <InnerGrid />
      </div>
    );
  }
  return (
    <div ref={ref} style={style} className="tile">
      {id}
    </div>
  );
}

// The inner grid shares the outer grid's provider (one dnd-kit manager), so tiles
// can be dragged between the inner and outer grids. Innermost-grid collision
// resolution keeps a drag that starts inside the inner grid scoped to it.
function InnerGrid() {
  return <InnerBoard />;
}

function InnerBoard() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "1", x: 0, y: 0, w: 2, h: 1 },
    { i: "2", x: 2, y: 0, w: 2, h: 1 },
    { i: "3", x: 4, y: 0, w: 2, h: 1 },
    { i: "4", x: 0, y: 1, w: 4, h: 1 },
  ]);
  // 8 columns in the 8-wide panel, matching the outer grid's rowHeight (52) and
  // default margin — so the inner cells line up with the outer grid's rhythm.
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange: setLayout,
    gridConfig: { cols: 8, rowHeight: 52 },
    isResizable: false,
  });
  return (
    <div ref={containerRef}>
      <div {...containerProps}>
        {layout.map((it) => (
          <Tile key={it.i} id={it.i} group={group} />
        ))}
      </div>
    </div>
  );
}
