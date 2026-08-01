<script setup>
import { DragDropProvider, useContainerWidth } from "@snapgridjs/vue";
import { shallowRef } from "vue";
import { GRID, HANDLE, STAGE_WIDTH } from "./demo-config";
import HandleTile from "./HandleTile.vue";
import HeadlessGridHost from "./HeadlessGridHost.vue";

// Drag only by the grip; the rest of the tile stays interactive. Headless: every tile is
// a custom HandleTile (useGridItem + setHandleRef grip). `isResizable` is off so a corner
// never starts a resize on these bar-headed tiles. containerWidth is measured outside the
// provider and fed in (it injects nothing, so it may live in the same component); the
// grid host is a CHILD of the provider. Mirrors the React/Svelte drag-handle demo.
const layout = shallowRef(HANDLE);
const { width, setRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });

const options = { gridConfig: GRID, isResizable: false };
const allCustom = () => true;
const onLayoutChange = (next) => {
  layout.value = next;
};
</script>

<template>
  <div :ref="setRef">
    <DragDropProvider>
      <HeadlessGridHost
        :layout="layout"
        :width="width"
        :onLayoutChange="onLayoutChange"
        :options="options"
        :isCustom="allCustom"
      >
        <template #tile="{ item, group }">
          <HandleTile :id="item.i" :group="group" />
        </template>
      </HeadlessGridHost>
    </DragDropProvider>
  </div>
</template>
