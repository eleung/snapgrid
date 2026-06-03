"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { type Layout, useContainerWidth, useGridContainer, useGridItem } from "@snapgridjs/react";
import { useState } from "react";

export function SnapExample() {
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
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
      <DragDropProvider>
        <Board layout={layout} onLayoutChange={setLayout} snapToGrid={snapToGrid} />
      </DragDropProvider>
    </div>
  );
}

function Board({
  layout,
  onLayoutChange,
  snapToGrid,
}: {
  layout: Layout;
  onLayoutChange: (next: Layout) => void;
  snapToGrid: boolean;
}) {
  const { width, containerRef } = useContainerWidth();
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    gridConfig: { rowHeight: 80 },
    dragConfig: { snapToGrid },
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
