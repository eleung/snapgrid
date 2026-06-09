"use client";

import { Feedback } from "@dnd-kit/dom";
import { useDraggable } from "@dnd-kit/react";
import {
  type Layout,
  SnapGridGroup,
  useContainerWidth,
  useGridContainer,
  useGridItem,
} from "@snapgridjs/react";
import { useState } from "react";

// Drag a copy (not the original) out of the palette.
const clone = [Feedback.configure({ feedback: "clone" })];

export function ExternalDropExample() {
  const [layout, setLayout] = useState<Layout>([{ i: "seed", x: 0, y: 0, w: 3, h: 2 }]);
  // SnapGridGroup shares one provider across the palette + grid.
  return (
    <SnapGridGroup>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="palette">
          <Chip id="small" w={2} h={1} />
          <Chip id="wide" w={4} h={1} />
          <Chip id="tall" w={2} h={3} />
        </div>
        <DropGrid layout={layout} onLayoutChange={setLayout} />
      </div>
    </SnapGridGroup>
  );
}

// A palette item: a plain useDraggable carrying the size to land as.
function Chip({ id, w, h }: { id: string; w: number; h: number }) {
  const { ref } = useDraggable({ id, data: { snapGridDrop: { w, h } }, plugins: clone });
  return (
    <div ref={ref} className="chip">
      {id}
    </div>
  );
}

function DropGrid({
  layout,
  onLayoutChange,
}: {
  layout: Layout;
  onLayoutChange: (next: Layout) => void;
}) {
  const { width, containerRef } = useContainerWidth();
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    gridConfig: { cols: 8, rowHeight: 56 },
    // Accept external draggables; `onDrop` gives you the next layout.
    dropConfig: { enabled: true, defaultItem: { w: 2, h: 2 } },
    onDrop: (next) => onLayoutChange(next),
  });
  return (
    <div ref={containerRef} style={{ flex: 1 }}>
      <div {...containerProps}>
        {layout.map((it) => (
          <Tile key={it.i} id={it.i} group={group} />
        ))}
      </div>
    </div>
  );
}

function Tile({ id, group }: { id: string; group: string }) {
  const { ref, style } = useGridItem({ id, group });
  return (
    <div ref={ref} style={style} className="tile">
      {id}
    </div>
  );
}
