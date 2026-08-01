<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { computed, ref, shallowRef } from "vue";
import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";
import HeadlessGrid from "./HeadlessGrid.vue";

// Toggle whether the dragged tile glides freely with the pointer or snaps to whole
// cells (dragConfig.snapToGrid).
const snap = ref(false);
const layout = shallowRef(BASIC.slice(0, 4));
const { width, setRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });

const options = computed(() => ({
  gridConfig: GRID,
  dragConfig: { snapToGrid: snap.value },
}));
const onLayoutChange = (next) => {
  layout.value = next;
};
</script>

<template>
  <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.8rem">
    <button
      type="button"
      class="dg-btn"
      :data-active="!snap || undefined"
      @click="snap = false"
    >
      glide (default)
    </button>
    <button
      type="button"
      class="dg-btn"
      :data-active="snap || undefined"
      @click="snap = true"
    >
      snapToGrid
    </button>
  </div>
  <div :ref="setRef">
    <HeadlessGrid
      :layout="layout"
      :width="width"
      :onLayoutChange="onLayoutChange"
      :options="options"
    />
  </div>
</template>
