"use client";

import { DragDropProvider } from "@dnd-kit/react";
import {
  GridDragOverlay,
  type Layout,
  useContainerWidth,
  useGridContainer,
  useGridItem,
} from "@snapgridjs/react";
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
    { i: "panel", x: 0, y: 0, w: 7, h: 4 },
    { i: "a", x: 7, y: 0, w: 5, h: 2 },
    { i: "b", x: 7, y: 2, w: 5, h: 2 },
  ]);
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange: setLayout,
    // The panel drags only from its header, which sits outside the inner grid.
    dragConfig: { handle: ".panel-header" },
    isResizable: false,
  });
  return (
    <div ref={containerRef}>
      <div {...containerProps}>
        {layout.map((it) => (
          <Tile key={it.i} id={it.i} group={group} />
        ))}
      </div>
      <GridDragOverlay>
        {({ item }) => (item ? <div className="tile">{item.i}</div> : null)}
      </GridDragOverlay>
    </div>
  );
}

function Tile({ id, group }: { id: string; group: string }) {
  const { ref, style } = useGridItem(id, group);
  if (id === "panel") {
    return (
      <div ref={ref} style={style} className="panel">
        <div className="panel-header">⠿ Nested board</div>
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

// The inner grid is its OWN provider, so its drags stay isolated from the outer.
function InnerGrid() {
  return (
    <DragDropProvider>
      <InnerBoard />
    </DragDropProvider>
  );
}

function InnerBoard() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "1", x: 0, y: 0, w: 1, h: 1 },
    { i: "2", x: 1, y: 0, w: 1, h: 1 },
    { i: "3", x: 2, y: 0, w: 1, h: 1 },
  ]);
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange: setLayout,
    gridConfig: { cols: 4, rowHeight: 40 },
    isResizable: false,
  });
  return (
    <div ref={containerRef}>
      <div {...containerProps}>
        {layout.map((it) => (
          <Tile key={it.i} id={it.i} group={group} />
        ))}
      </div>
      <GridDragOverlay>
        {({ item }) => (item ? <div className="tile">{item.i}</div> : null)}
      </GridDragOverlay>
    </div>
  );
}
