/** @jsxImportSource solid-js */
import {
  DragDropProvider,
  insertItemWithCompactor,
  removeItemWithCompactor,
  useContainerWidth,
  verticalCompactor,
} from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { ArchivePanelTile } from "./ArchivePanelTile";
import { HeadlessGridHost } from "./HeadlessGrid";
import { ARCHIVE_ZONE_ID, DROPZONE_INIT, GRID, STAGE_WIDTH } from "./demo-config";

// A grid whose right-hand "Archive" panel is a plain (non-grid) droppable that opts into
// snapgrid's depth ranking, so a tile dragged over it resolves to the ZONE, not the grid
// underneath: the grid backs off (reverts the tile) and the zone lights up. The drop
// archives the tile (removing it + re-packing the hole); click a chip to restore. Mirrors
// the React/Svelte/Vue nested-drop-zone demo.
export default function NestedDropZone() {
  const [layout, setLayout] = createSignal(DROPZONE_INIT);
  const [archived, setArchived] = createSignal<string[]>([]);
  const { width, ref } = useContainerWidth({ initialWidth: STAGE_WIDTH });

  // Restore an archived tile: drop it back into the grid (re-packing). All tiles 4×2.
  const restore = (id: string) => {
    setLayout((current) =>
      insertItemWithCompactor(current, { i: id, x: 0, y: 0, w: 4, h: 2 }, 0, 0, {
        compactor: verticalCompactor,
        cols: GRID.cols,
      }),
    );
    setArchived((list) => list.filter((x) => x !== id));
  };

  return (
    <div ref={ref}>
      <DragDropProvider
        onDragEnd={(event) => {
          // The zone won the collision, so it's the resolved target; the grid reverted the
          // tile. Archive it: pull it out of the grid (re-packing the hole), add its chip.
          const { source, target } = event.operation;
          if (target?.id === ARCHIVE_ZONE_ID && source?.type === "grid-item") {
            const id = String(source.id);
            setLayout((current) =>
              removeItemWithCompactor(current, id, {
                compactor: verticalCompactor,
                cols: GRID.cols,
              }),
            );
            setArchived((list) => (list.includes(id) ? list : [...list, id]));
          }
        }}
      >
        <HeadlessGridHost
          layout={layout()}
          width={width()}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID, isResizable: false }}
          isCustom={(it) => it.i === "archive"}
          tile={(item, group) => (
            <ArchivePanelTile
              id={item().i}
              group={group}
              archived={archived()}
              onRestore={restore}
            />
          )}
        />
      </DragDropProvider>
    </div>
  );
}
