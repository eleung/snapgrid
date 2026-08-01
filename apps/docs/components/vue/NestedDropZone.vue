<script setup>
import {
  DragDropProvider,
  insertItemWithCompactor,
  removeItemWithCompactor,
  useContainerWidth,
  verticalCompactor,
} from "@snapgridjs/vue";
import { shallowRef } from "vue";
import ArchivePanelTile from "./ArchivePanelTile.vue";
import { ARCHIVE_ZONE_ID, DROPZONE_INIT, GRID, STAGE_WIDTH } from "./demo-config";
import HeadlessGridHost from "./HeadlessGridHost.vue";

// A grid whose right-hand "Archive" panel is a plain (non-grid) droppable that opts into
// snapgrid's depth ranking, so a tile dragged over it resolves to the ZONE, not the grid
// underneath: the grid backs off (reverts the tile) and the zone lights up. The drop
// archives the tile (removing it + re-packing the hole); click a chip to restore. Mirrors
// the React/Svelte nested-drop-zone demo.
const layout = shallowRef(DROPZONE_INIT);
const archived = shallowRef([]);
const { width, setRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });

const options = { gridConfig: GRID, isResizable: false };
const isArchive = (it) => it.i === "archive";
const onLayoutChange = (next) => {
  layout.value = next;
};

// Restore an archived tile: drop it back into the grid (re-packing). All tiles 4×2.
function restore(id) {
  layout.value = insertItemWithCompactor(layout.value, { i: id, x: 0, y: 0, w: 4, h: 2 }, 0, 0, {
    compactor: verticalCompactor,
    cols: GRID.cols,
  });
  archived.value = archived.value.filter((x) => x !== id);
}

function onDragEnd(event) {
  // The zone won the collision, so it's the resolved target; the grid reverted the tile.
  // Archive it: pull it out of the grid (re-packing the hole) and add its chip.
  const { source, target } = event.operation;
  if (target?.id === ARCHIVE_ZONE_ID && source?.type === "grid-item") {
    const id = String(source.id);
    layout.value = removeItemWithCompactor(layout.value, id, {
      compactor: verticalCompactor,
      cols: GRID.cols,
    });
    archived.value = archived.value.includes(id) ? archived.value : [...archived.value, id];
  }
}
</script>

<template>
  <div :ref="setRef">
    <DragDropProvider @drag-end="onDragEnd">
      <HeadlessGridHost
        :layout="layout"
        :width="width"
        :onLayoutChange="onLayoutChange"
        :options="options"
        :isCustom="isArchive"
      >
        <template #tile="{ item, group }">
          <ArchivePanelTile
            :id="item.i"
            :group="group"
            :archived="archived"
            :onRestore="restore"
          />
        </template>
      </HeadlessGridHost>
    </DragDropProvider>
  </div>
</template>
