<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { shallowRef } from "vue";
import DemoTile from "./DemoTile.vue";
import { GRID, NESTED_INNER, NESTED_OUTER, STAGE_WIDTH } from "./demo-config";
import HeadlessGrid from "./HeadlessGrid.vue";
import NestedPanelTile from "./NestedPanelTile.vue";

// A grid inside another grid's tile — they share one provider (a nested grid detects the
// ancestor and doesn't mint a second manager), so a tile can be dragged between the inner
// and outer grids. The panel renders as a custom tile so its header is the drag handle;
// the other outer tiles fall back to the default tile.
const outer = shallowRef(NESTED_OUTER);
const inner = shallowRef(NESTED_INNER);
const { width, setRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });

const options = { gridConfig: GRID, isResizable: false };
const isPanel = (it) => it.i === "panel";
const onOuterChange = (next) => {
  outer.value = next;
};
const onInnerChange = (next) => {
  inner.value = next;
};
const isAccent = (id) => id === "b";
</script>

<template>
  <div :ref="setRef">
    <HeadlessGrid
      :layout="outer"
      :width="width"
      :onLayoutChange="onOuterChange"
      :options="options"
      :isCustom="isPanel"
    >
      <template #tile="{ item, group }">
        <NestedPanelTile
          :id="item.i"
          :group="group"
          :inner="inner"
          :onInnerChange="onInnerChange"
        />
      </template>
      <template #content="{ item }">
        <DemoTile :label="item.i.toUpperCase()" :accent="isAccent(item.i)" />
      </template>
    </HeadlessGrid>
  </div>
</template>
