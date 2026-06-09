"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { type Layout, useContainerWidth, useGridContainer, useGridItem } from "@snapgridjs/react";
import { useState } from "react";

export function DragHandleExample() {
  return (
    <DragDropProvider>
      <Board />
    </DragDropProvider>
  );
}

function Board() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
  ]);
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange: setLayout,
    gridConfig: { rowHeight: 80 },
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
  const { ref, style, handleRef } = useGridItem({ id, group });
  // Attach handleRef to the grip — only a pointer-down there starts a drag, so
  // the button stays clickable. (Keyboard pickup still works on the focused tile.)
  return (
    <div ref={ref} style={style} className="tile">
      <span ref={handleRef} className="drag-handle">
        ⠿ {id}
      </span>
      <button type="button" onClick={() => window.alert(`clicked ${id}`)}>
        Click me
      </button>
    </div>
  );
}
