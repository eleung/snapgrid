<script lang="ts">
  import { move } from "@dnd-kit/helpers";
  import {
    DragDropProvider,
    type Layout,
    removeItemWithCompactor,
    snapMove,
    verticalCompactor,
  } from "@snapgridjs/svelte";
  import { INTEROP_GRID, INTEROP_GRID_INIT, INTEROP_TRAY_INIT } from "./demo-config";
  import SortableGridBody from "./SortableGridBody.svelte";

  // A grid beside a dnd-kit *sortable* tray, under ONE DragDropProvider. Drag a tray
  // card into the grid (it lands at a real cell, with compaction) or a grid tile out
  // into the tray; reorder the tray itself. The cross-parent moves are reduced LIVE in
  // onDragOver — dnd-kit reparents the node mid-drag, so reducing on drop would desync.
  // snapMove() is the grid-side reducer; dnd-kit's move() handles the tray. In-grid
  // moves are left to the grid's engine. Mirrors the React interop demo.
  let grid = $state<Layout>(INTEROP_GRID_INIT);
  let tray = $state<string[]>(INTEROP_TRAY_INIT);

  /** Insert `id` into `list` just before `beforeId` (removing any existing copy). */
  function insertBefore(list: string[], id: string, beforeId: string): string[] {
    const without = list.filter((x) => x !== id);
    const i = without.indexOf(beforeId);
    return i < 0 ? [...without, id] : [...without.slice(0, i), id, ...without.slice(i)];
  }

  // biome-ignore lint/suspicious/noExplicitAny: dnd-kit event type; only `.operation` is read.
  function onDragOver(event: any) {
    const { source, target } = event.operation;
    if (!source || !target) return;
    const id = String(source.id);
    const st = source.type;
    const tt = target.type;
    if (st === "tray-card" && tt === "grid") {
      // Tray card → grid: drop it out of the tray and into the layout.
      tray = tray.filter((x) => x !== id);
      grid = snapMove(grid, event, { defaultItem: { w: 2, h: 2 } });
    } else if (st === "grid-item" && tt === "tray-card") {
      // Grid tile → tray: pull it out of the grid (re-packing the hole) and into the tray.
      grid = removeItemWithCompactor(grid, id, {
        compactor: verticalCompactor,
        cols: INTEROP_GRID.cols,
      });
      tray = tray.includes(id) ? tray : insertBefore(tray, id, String(target.id));
    } else if (st === "tray-card" && tt === "tray-card") {
      // Reorder within the tray.
      tray = move(tray, event);
    }
    // In-grid moves fall through — the grid's engine drives them.
  }
</script>

<DragDropProvider {onDragOver}>
  <SortableGridBody {grid} onGridChange={(next) => (grid = next)} {tray} />
</DragDropProvider>
