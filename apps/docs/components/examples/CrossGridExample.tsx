"use client";

import {
  type Layout,
  SnapGridGroup,
  useContainerWidth,
  useGridContainer,
  useGridItem,
} from "@snapgridjs/react";
import { useState } from "react";

export function CrossGridExample() {
  const [left, setLeft] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 3, h: 2 },
    { i: "b", x: 3, y: 0, w: 3, h: 1 },
  ]);
  const [right, setRight] = useState<Layout>([{ i: "c", x: 0, y: 0, w: 3, h: 1 }]);
  // SnapGridGroup is the shared provider — tiles drag between the grids.
  // Item ids must be unique across the group.
  return (
    <SnapGridGroup>
      <div style={{ display: "flex", gap: "1rem" }}>
        <SubGrid label="A" layout={left} onLayoutChange={setLeft} />
        <SubGrid label="B" layout={right} onLayoutChange={setRight} />
      </div>
    </SnapGridGroup>
  );
}

function SubGrid({
  label,
  layout,
  onLayoutChange,
}: {
  label: string;
  layout: Layout;
  onLayoutChange: (next: Layout) => void;
}) {
  const { width, containerRef } = useContainerWidth();
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    gridConfig: { cols: 6, rowHeight: 60 },
  });
  return (
    <div className="subgrid">
      <span className="subgrid__label">{label}</span>
      <div ref={containerRef}>
        <div {...containerProps}>
          {layout.map((it) => (
            <Tile key={it.i} id={it.i} group={group} />
          ))}
        </div>
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
