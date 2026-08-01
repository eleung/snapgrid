<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { shallowRef } from "vue";
import DemoTile from "./DemoTile.vue";
import { GRID, RESIZE, STAGE_WIDTH } from "./demo-config";
import HeadlessGrid from "./HeadlessGrid.vue";

// Per-item resize constraints: drag any corner; minW/maxW/minH/maxH are enforced.
// The tile labels double as their constraint ("min 2×1", "max 6×3", "free").
const layout = shallowRef(RESIZE);
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
    >
      <template #content="{ item }">
        <DemoTile :label="item.i" :meta="`${item.w}×${item.h}`" />
      </template>
    </HeadlessGrid>
  </div>
</template>
