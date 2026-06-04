"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { type Layout, useContainerWidth, useGridContainer, useGridItem } from "@snapgridjs/react";
import { useState } from "react";

export function StaticItemExample() {
  return (
    <DragDropProvider>
      <Board />
    </DragDropProvider>
  );
}

function Board() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 3, h: 2 },
    // `static: true` anchors a tile — others flow around it.
    { i: "locked", x: 3, y: 0, w: 3, h: 2, static: true },
    // Add `isDraggable: true` to stay anchored against reflow but let the user
    // still drag it ("pinned").
    { i: "pinned", x: 6, y: 0, w: 3, h: 2, static: true, isDraggable: true },
    { i: "b", x: 9, y: 0, w: 3, h: 2 },
  ]);
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange: setLayout,
    gridConfig: { rowHeight: 80 },
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
  const { ref, style } = useGridItem(id, group);
  return (
    <div ref={ref} style={style} className="tile">
      {id}
    </div>
  );
}
