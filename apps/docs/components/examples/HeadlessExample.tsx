"use client";

import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import {
  type Layout,
  useContainerWidth,
  useGridContainer,
  useGridItem,
  useGridPlaceholder,
} from "@snapgridjs/react";
import { useState } from "react";

export function HeadlessExample() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
  ]);

  return (
    <div ref={containerRef}>
      <DragDropProvider>
        <Surface items={layout} width={width} onLayoutChange={setLayout} />
        <DragOverlay>
          {(source) => (source ? <div className="tile">{String(source.id)}</div> : null)}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}

// Render your own markup with the hooks — useGridContainer is the grid host;
// items resolve it by the returned `group`.
function Surface({
  items,
  width,
  onLayoutChange,
}: { items: Layout; width: number; onLayoutChange: (l: Layout) => void }) {
  const { containerProps, group } = useGridContainer({ layout: items, width, onLayoutChange });
  const placeholder = useGridPlaceholder(group);
  return (
    <div {...containerProps}>
      {items.map((item) => (
        <Tile key={item.i} id={item.i} group={group} />
      ))}
      {placeholder && <div className="placeholder" style={placeholder.style} />}
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
