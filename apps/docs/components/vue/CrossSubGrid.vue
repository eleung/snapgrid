<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { CROSS } from "./demo-config";
import HeadlessGridHost from "./HeadlessGridHost.vue";

// One grid of the cross-grid pair, in its own bordered card so the two are visibly
// distinct. Width is measured from an inner div (no padding/border) so the surface fits
// exactly. No DragDropProvider here — the enclosing SnapGridGroup provides the shared one
// (and this component is a CHILD of it, so the host's composables resolve its manager),
// letting tiles cross between the two grids. Mirrors React/Svelte `CrossSubGrid`.
defineProps({ label: String, layout: Array, onLayoutChange: Function });

const { width, setRef } = useContainerWidth({ initialWidth: 371 });
const options = { gridConfig: CROSS };
</script>

<template>
  <div class="dg-subgrid">
    <span class="dg-subgrid__label">{{ label }}</span>
    <div :ref="setRef">
      <HeadlessGridHost
        :layout="layout"
        :width="width"
        :onLayoutChange="onLayoutChange"
        :options="options"
      />
    </div>
  </div>
</template>
