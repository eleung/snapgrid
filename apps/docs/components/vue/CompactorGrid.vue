<script setup>
import { gravityCompactor, masonryCompactor, shelfCompactor } from "@snapgridjs/extras";
import {
  horizontalCompactor,
  noCompactor,
  useContainerWidth,
  verticalCompactor,
} from "@snapgridjs/vue";
import { computed, ref, shallowRef } from "vue";
import { GRID, PACK, STAGE_WIDTH } from "./demo-config";
import HeadlessGrid from "./HeadlessGrid.vue";

// Swap the packing algorithm at runtime. vertical/horizontal come from the core;
// masonry/gravity/shelf from @snapgridjs/extras; "none" leaves tiles where dropped.
const PACKERS = {
  vertical: verticalCompactor,
  horizontal: horizontalCompactor,
  masonry: masonryCompactor,
  gravity: gravityCompactor,
  shelf: shelfCompactor,
  none: noCompactor,
};
const PACKER_NAMES = Object.keys(PACKERS);

const packer = ref("vertical");
const layout = shallowRef(PACK);
const { width, setRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });

const options = computed(() => ({
  gridConfig: GRID,
  compactor: PACKERS[packer.value] ?? verticalCompactor,
}));

const selectPacker = (name) => {
  packer.value = name;
  layout.value = PACKERS[name]?.compact(layout.value, GRID.cols) ?? layout.value;
};
const onLayoutChange = (next) => {
  layout.value = next;
};
</script>

<template>
  <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.8rem">
    <button
      v-for="name in PACKER_NAMES"
      :key="name"
      type="button"
      class="dg-btn"
      :data-active="packer === name || undefined"
      @click="selectPacker(name)"
    >
      {{ name }}
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
