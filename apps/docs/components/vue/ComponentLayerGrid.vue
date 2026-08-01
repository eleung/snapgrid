<script setup>
import { GridLayout, useContainerWidth } from "@snapgridjs/vue";
import { shallowRef } from "vue";
import DemoTile from "./DemoTile.vue";
import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";

// The turnkey shell: <GridLayout> mints its own DragDropProvider (and runs the surface in
// a child component, so the composables still see the manager) and renders the tiles,
// resize handles, and placeholder — no composables, no dnd-kit wiring. The rest of the
// gallery is headless; this one demo shows the component layer. Item content comes from
// the `item` scoped slot.
const layout = shallowRef(BASIC.slice(0, 4));
const { width, setRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });

const resizeConfig = { handles: ["se"] };
const onLayoutChange = (next) => {
  layout.value = next;
};
</script>

<template>
  <div class="dg-cl" :ref="setRef">
    <GridLayout
      :layout="layout"
      :width="width"
      :gridConfig="GRID"
      :resizeConfig="resizeConfig"
      :onLayoutChange="onLayoutChange"
    >
      <template #item="{ item }">
        <DemoTile :label="item.i.toUpperCase()" :meta="`${item.w}×${item.h}`" />
      </template>
    </GridLayout>
  </div>
</template>
