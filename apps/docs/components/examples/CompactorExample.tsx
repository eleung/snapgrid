"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { gravityCompactor, masonryCompactor, shelfCompactor } from "@snapgridjs/extras";
import {
  type Compactor,
  type Layout,
  horizontalCompactor,
  noCompactor,
  useContainerWidth,
  useGridContainer,
  useGridItem,
  verticalCompactor,
} from "@snapgridjs/react";
import { useState } from "react";

const PACKERS: Record<string, Compactor> = {
  vertical: verticalCompactor,
  horizontal: horizontalCompactor,
  masonry: masonryCompactor,
  gravity: gravityCompactor,
  shelf: shelfCompactor,
  none: noCompactor,
};

export function CompactorExample() {
  const [packer, setPacker] = useState("vertical");
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 3, h: 2 },
    { i: "b", x: 3, y: 0, w: 2, h: 3 },
    { i: "c", x: 5, y: 0, w: 4, h: 1 },
    { i: "d", x: 9, y: 0, w: 3, h: 2 },
  ]);
  // The controls use no grid hooks, so they sit outside the provider.
  return (
    <div>
      <div className="controls">
        {Object.keys(PACKERS).map((name) => (
          <button
            key={name}
            type="button"
            data-active={packer === name || undefined}
            onClick={() => {
              setPacker(name);
              setLayout((prev) => PACKERS[name]?.compact(prev, 12) ?? prev);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <DragDropProvider>
        <Board layout={layout} onLayoutChange={setLayout} compactor={PACKERS[packer]} />
      </DragDropProvider>
    </div>
  );
}

function Board({
  layout,
  onLayoutChange,
  compactor,
}: {
  layout: Layout;
  onLayoutChange: (next: Layout) => void;
  compactor: Compactor;
}) {
  const { width, containerRef } = useContainerWidth();
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    gridConfig: { rowHeight: 80 },
    compactor,
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
  const { ref, style } = useGridItem({ id, group });
  return (
    <div ref={ref} style={style} className="tile">
      {id}
    </div>
  );
}
