<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { computed } from "vue";
import { EXTERNAL_GRID } from "./demo-config";
import HeadlessGridHost from "./HeadlessGridHost.vue";

// The drop target: a headless grid with dropConfig enabled. The engine synthesizes the
// dropped item; onDrop relabels its ugly minted id (`<gridId>-dropped-N`) to a short one.
// No own provider — the enclosing SnapGridGroup shares it with the palette, and this
// component is a CHILD of it so the host resolves that manager.
const props = defineProps({ layout: Array, onLayoutChange: Function });

const { width, setRef } = useContainerWidth({ initialWidth: 684 });
const gridWidth = computed(() => Math.max(180, width.value));

let dropCount = 0;
const onDrop = (next, item) => {
  dropCount += 1;
  const shortId = `t${dropCount}`;
  props.onLayoutChange(next.map((it) => (it.i === item.i ? { ...it, i: shortId } : it)));
};

const options = {
  gridConfig: EXTERNAL_GRID,
  dropConfig: { enabled: true, defaultItem: { w: 2, h: 2 } },
  onDrop,
};
</script>

<template>
  <div class="dg-subgrid">
    <span class="dg-subgrid__label">Grid (drop here)</span>
    <div :ref="setRef">
      <HeadlessGridHost
        :layout="layout"
        :width="gridWidth"
        :onLayoutChange="onLayoutChange"
        :options="options"
      />
    </div>
  </div>
</template>
