"use client";

import { GridLayout, type Layout, SnapGridGroup, useContainerWidth } from "@snapgridjs/react";
import { useState } from "react";

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
  return (
    <div className="subgrid">
      <span className="subgrid__label">{label}</span>
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={onLayoutChange}
          gridConfig={{ cols: 6, rowHeight: 48 }}
        >
          {layout.map((item) => (
            <div key={item.i} className="tile">
              {item.i}
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  );
}

export function CrossGridExample() {
  const [left, setLeft] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 3, h: 2 },
    { i: "b", x: 3, y: 0, w: 3, h: 1 },
  ]);
  const [right, setRight] = useState<Layout>([{ i: "c", x: 0, y: 0, w: 3, h: 1 }]);

  // Wrap the grids in a SnapGridGroup to drag tiles between them. Item ids must
  // be unique across every grid in the group.
  return (
    <SnapGridGroup>
      <div style={{ display: "flex", gap: "1rem" }}>
        <SubGrid label="Grid A" layout={left} onLayoutChange={setLeft} />
        <SubGrid label="Grid B" layout={right} onLayoutChange={setRight} />
      </div>
    </SnapGridGroup>
  );
}
