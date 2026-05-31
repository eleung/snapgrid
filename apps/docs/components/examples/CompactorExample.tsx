"use client";

import { gravityCompactor, masonryCompactor, shelfCompactor } from "@snapgrid/extras";
import {
  type Compactor,
  GridLayout,
  type Layout,
  horizontalCompactor,
  noCompactor,
  useContainerWidth,
  verticalCompactor,
} from "@snapgrid/react";
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
  const { width, containerRef } = useContainerWidth();
  const [packer, setPacker] = useState("vertical");
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 3, h: 2 },
    { i: "b", x: 3, y: 0, w: 2, h: 3 },
    { i: "c", x: 5, y: 0, w: 4, h: 1 },
    { i: "d", x: 9, y: 0, w: 3, h: 2 },
  ]);

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
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={{ cols: 12, rowHeight: 52 }}
          compactor={PACKERS[packer]}
        >
          {layout.map((item) => (
            <div key={item.i} className="tile">
              <span className="tile__id">{item.i}</span>
              <span className="tile__dim">
                {item.w}×{item.h}
              </span>
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  );
}
