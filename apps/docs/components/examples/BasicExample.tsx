"use client";

import { DragDropProvider } from "@dnd-kit/react";
import {
  type Layout,
  useContainerWidth,
  useGridContainer,
  useGridItem,
  useGridResizeHandle,
} from "@snapgridjs/react";
import { useState } from "react";

export function BasicExample() {
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
    resizeConfig: { handles: ["se"] },
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
  const resize = useGridResizeHandle(id, "se", group);
  return (
    <div ref={ref} style={style} className="tile">
      {id}
      <span ref={resize.ref} {...resize.handleProps} className="resize-handle" />
    </div>
  );
}
