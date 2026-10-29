/** @jsxImportSource solid-js */
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  removeItemWithCompactor,
  snapMove,
  verticalCompactor,
} from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { SortableGridBody } from "./SortableGridBody";
import { INTEROP_GRID, INTEROP_GRID_INIT, INTEROP_TRAY_INIT } from "./demo-config";

/** Insert `id` into `list` just before `beforeId` (removing any existing copy). */
function insertBefore(list: string[], id: string, beforeId: string): string[] {
  const without = list.filter((x) => x !== id);
  const i = without.indexOf(beforeId);
  return i < 0 ? [...without, id] : [...without.slice(0, i), id, ...without.slice(i)];
}

// A grid beside a dnd-kit *sortable* tray, under ONE DragDropProvider. Drag a tray card
// into the grid (it lands at a real cell, with compaction) or a grid tile out into the
// tray; reorder the tray itself. The cross-parent moves are reduced LIVE in onDragOver —
// dnd-kit reparents the node mid-drag, so reducing on drop would desync. snapMove() is the
// grid-side reducer; dnd-kit's move() handles the tray. In-grid moves are left to the
// grid's engine. Mirrors the React/Svelte/Vue interop demo.
export default function SortableGrid() {
  const [grid, setGrid] = createSignal(INTEROP_GRID_INIT);
  const [tray, setTray] = createSignal(INTEROP_TRAY_INIT);

  return (
    <DragDropProvider
      onDragOver={(event) => {
        const { source, target } = event.operation;
        if (!source || !target) return;
        const id = String(source.id);
        if (source.type === "tray-card" && target.type === "grid") {
          // Tray card → grid: drop it out of the tray and into the layout.
          setTray((list) => list.filter((x) => x !== id));
          setGrid((layout) => snapMove(layout, event, { defaultItem: { w: 2, h: 2 } }));
        } else if (source.type === "grid-item" && target.type === "tray-card") {
          // Grid tile → tray: pull it out of the grid (re-packing the hole), into the tray.
          setGrid((layout) =>
            removeItemWithCompactor(layout, id, {
              compactor: verticalCompactor,
              cols: INTEROP_GRID.cols,
            }),
          );
          setTray((list) => (list.includes(id) ? list : insertBefore(list, id, String(target.id))));
        } else if (source.type === "tray-card" && target.type === "tray-card") {
          // Reorder within the tray.
          setTray((list) => move(list, event));
        }
        // In-grid moves fall through — the grid's engine drives them.
      }}
    >
      <SortableGridBody grid={grid()} onGridChange={setGrid} tray={tray()} />
    </DragDropProvider>
  );
}
