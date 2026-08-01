<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { shallowRef } from "vue";
import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";
import HeadlessGrid from "./HeadlessGrid.vue";

// A real @snapgridjs/vue grid: drag a tile, resize from the SE corner, watch the rest
// compact upward. Headless composition (useGridContainer + useGridItem), mirroring the
// React/Svelte basic demo — the layout math + drag engine are the shared, framework-free
// core.
const layout = shallowRef(BASIC);
const { width, setRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });

const options = { gridConfig: GRID, resizeConfig: { handles: ["se"] } };
const onLayoutChange = (next) => {
  layout.value = next;
};
</script>

<template>
  <div :ref="setRef">
    <HeadlessGrid
      :layout="layout"
      :width="width"
      :onLayoutChange="onLayoutChange"
      :options="options"
      resizable
    />
  </div>
</template>
