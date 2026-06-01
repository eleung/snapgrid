"use client";

import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import {
  type Layout,
  SnapGridProvider,
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
        <SnapGridProvider layout={layout} width={width} onLayoutChange={setLayout}>
          <Surface items={layout} />
        </SnapGridProvider>
        <DragOverlay>
          {(source) => (source ? <div className="tile">{String(source.id)}</div> : null)}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}

// Render your own markup with the hooks — snapgrid supplies positioning props.
function Surface({ items }: { items: Layout }) {
  const { containerProps } = useGridContainer();
  const placeholder = useGridPlaceholder();
  return (
    <div {...containerProps}>
      {items.map((item) => (
        <Tile key={item.i} id={item.i} />
      ))}
      {placeholder && <div className="placeholder" style={placeholder.style} />}
    </div>
  );
}

function Tile({ id }: { id: string }) {
  const { ref, style } = useGridItem(id);
  return (
    <div ref={ref} style={style} className="tile">
      {id}
    </div>
  );
}
