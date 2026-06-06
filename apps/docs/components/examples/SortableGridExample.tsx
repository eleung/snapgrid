"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  type Layout,
  defaultGridConfig,
  removeItemWithCompactor,
  snapMove,
  toPositionParams,
  useContainerWidth,
  useGridContainer,
  useGridItem,
  useGridPlaceholder,
  verticalCompactor,
} from "@snapgridjs/react";
import { useState } from "react";

const GRID = { cols: 6, rowHeight: 60 };
const TRAY_W = 120; // the tray column's fixed width
const GAP = 16; // the flex gap between tray and grid

export function SortableGridExample() {
  const { width, containerRef } = useContainerWidth();
  const [grid, setGrid] = useState<Layout>([
    { i: "chart", x: 0, y: 0, w: 4, h: 2 },
    { i: "stats", x: 4, y: 0, w: 2, h: 2 },
  ]);
  const [tray, setTray] = useState<string[]>(["users", "sales", "tasks"]);

  // The grid renders narrower than the measured container — the tray takes a fixed
  // column. Use that same gridWidth for the host AND snapMove's cell math, so the
  // dropped cell lines up with what's rendered.
  const gridWidth = Math.max(160, width - TRAY_W - GAP);
  const positionParams = toPositionParams({ ...defaultGridConfig, ...GRID }, gridWidth);

  return (
    // One DragDropProvider hosts the grid AND the sortable tray. Cross-parent moves
    // are reduced LIVE in onDragOver: dnd-kit reparents the dragged node mid-drag, so
    // reducing only on drop would desync React (removeChild). In-grid moves fall
    // through — the grid's own engine drives them.
    <div ref={containerRef}>
      <DragDropProvider
        onDragOver={(event) => {
          const { source, target } = event.operation;
          if (!source || !target) return;
          const id = String(source.id);

          if (source.type === "tray-card" && target.type === "grid") {
            // Tray card → grid: out of the tray, into the layout at the hovered cell.
            setTray((t) => t.filter((x) => x !== id));
            setGrid((g) =>
              snapMove(g, event, {
                positionParams,
                compactor: verticalCompactor,
                defaultItem: { w: 2, h: 2 },
              }),
            );
          } else if (source.type === "grid-item" && target.type === "tray-card") {
            // Grid tile → tray: remove it AND re-pack the hole (a plain filter would
            // leave a gap), then drop it into the tray before the hovered card.
            setGrid((g) =>
              removeItemWithCompactor(g, id, { compactor: verticalCompactor, cols: GRID.cols }),
            );
            setTray((t) => (t.includes(id) ? t : insertBefore(t, id, String(target.id))));
          } else if (source.type === "tray-card" && target.type === "tray-card") {
            // Reorder within the tray — dnd-kit's own list helper.
            setTray((t) => move(t, event));
          }
        }}
      >
        <Body grid={grid} setGrid={setGrid} tray={tray} width={gridWidth} />
      </DragDropProvider>
    </div>
  );
}

// Rendered INSIDE the provider so useGridContainer resolves the shared manager.
function Body({
  grid,
  setGrid,
  tray,
  width,
}: {
  grid: Layout;
  setGrid: (next: Layout) => void;
  tray: string[];
  width: number;
}) {
  const { containerProps, group } = useGridContainer({
    layout: grid,
    width,
    onLayoutChange: setGrid,
    gridConfig: GRID,
    isResizable: false,
    // Accept the tray's cards as drop targets; the onDragOver above does the receive.
    accept: (s) => s.type === "tray-card",
  });
  const placeholder = useGridPlaceholder(group);
  return (
    <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
      <div className="palette" style={{ width: TRAY_W, flex: "0 0 auto" }}>
        {tray.map((id, i) => (
          <TrayCard key={id} id={id} index={i} />
        ))}
      </div>
      <div {...containerProps} style={{ ...containerProps.style, flex: "1 1 auto" }}>
        {grid.map((it) => (
          <GridTile key={it.i} id={it.i} group={group} />
        ))}
        {placeholder ? <div className="placeholder" style={placeholder.style} /> : null}
      </div>
    </div>
  );
}

// A grid tile — positioned by snapgrid; a real useSortable under the hood, so it
// interoperates with the tray.
function GridTile({ id, group }: { id: string; group: string }) {
  const { ref, style } = useGridItem(id, group);
  return (
    <div ref={ref} style={style} className="tile">
      {id}
    </div>
  );
}

// A tray card — a plain dnd-kit useSortable. It accepts other tray cards (reorder)
// and grid tiles (drop one in).
function TrayCard({ id, index }: { id: string; index: number }) {
  const { ref } = useSortable({
    id,
    index,
    group: "tray",
    type: "tray-card",
    accept: ["tray-card", "grid-item"],
  });
  return (
    <div ref={ref} className="chip">
      {id}
    </div>
  );
}

// Insert `id` into `list` just before `beforeId` (removing any existing copy).
function insertBefore(list: string[], id: string, beforeId: string): string[] {
  const without = list.filter((x) => x !== id);
  const i = without.indexOf(beforeId);
  return i < 0 ? [...without, id] : [...without.slice(0, i), id, ...without.slice(i)];
}
