<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { computed, ref, shallowRef } from "vue";
import AnchorTile from "./AnchorTile.vue";
import { GRID, STAGE_WIDTH, STATIC } from "./demo-config";
import HeadlessGrid from "./HeadlessGrid.vue";

// Toggle the "anchor" tile between LOCKED (static, can't move) and PINNED (static but
// still draggable by its grip). Either way, the others flow around it. `view` re-derives
// the anchor's isDraggable from `pinned`; drags commit to `layout`.
const pinned = ref(false);
const layout = shallowRef(STATIC);
const view = computed(() =>
  layout.value.map((it) => (it.i === "anchor" ? { ...it, isDraggable: pinned.value } : it)),
);
const { width, setRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });

const options = { gridConfig: GRID };
const isAnchor = (it) => it.i === "anchor";
const onLayoutChange = (next) => {
  layout.value = next;
};
const togglePin = () => {
  pinned.value = !pinned.value;
};
</script>

<template>
  <div :ref="setRef">
    <HeadlessGrid
      :layout="view"
      :width="width"
      :onLayoutChange="onLayoutChange"
      :options="options"
      :isCustom="isAnchor"
    >
      <template #tile="{ item, group }">
        <AnchorTile :id="item.i" :group="group" :pinned="pinned" :onTogglePin="togglePin" />
      </template>
    </HeadlessGrid>
  </div>
</template>
