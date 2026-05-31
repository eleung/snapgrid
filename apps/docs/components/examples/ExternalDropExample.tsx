"use client";

import { Feedback } from "@dnd-kit/dom";
import { useDraggable } from "@dnd-kit/react";
import { GridLayout, type Layout, SnapGridGroup, useContainerWidth } from "@snapgrid/react";
import { useState } from "react";

// Drag a copy (not the original) out of the palette.
const clone = [Feedback.configure({ feedback: "clone" })];

// A palette item: any draggable whose data carries `snapGridDrop` with the
// size it should land as.
function PaletteChip({ id, label, w, h }: { id: string; label: string; w: number; h: number }) {
  const { ref } = useDraggable({ id, data: { snapGridDrop: { w, h } }, plugins: clone });
  return (
    <div ref={ref} className="chip">
      {label} ({w}×{h})
    </div>
  );
}

export function ExternalDropExample() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([{ i: "seed", x: 0, y: 0, w: 3, h: 2 }]);

  return (
    <SnapGridGroup>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="palette">
          <PaletteChip id="small" label="small" w={2} h={1} />
          <PaletteChip id="wide" label="wide" w={4} h={1} />
          <PaletteChip id="tall" label="tall" w={2} h={3} />
        </div>
        <div ref={containerRef} style={{ flex: 1 }}>
          <GridLayout
            layout={layout}
            width={width}
            onLayoutChange={setLayout}
            // Accept external draggables; `onDrop` gives you the next layout.
            dropConfig={{ enabled: true, defaultItem: { w: 2, h: 2 } }}
            onDrop={(next) => setLayout(next)}
            gridConfig={{ cols: 8, rowHeight: 44 }}
          >
            {layout.map((item) => (
              <div key={item.i} className="tile">
                {item.i}
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    </SnapGridGroup>
  );
}
