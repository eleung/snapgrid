<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { INTEROP_GAP, INTEROP_GRID, INTEROP_TRAY_W, STAGE_WIDTH } from "./demo-config";
import HeadlessGridHost from "./HeadlessGridHost.vue";
import TrayCard from "./TrayCard.vue";

// Rendered inside the provider so useGridContainer resolves the shared manager. Measures
// the grid's OWN flex slot (beside the fixed-width tray) so its width feeds the grid
// directly — no measuring the whole row and subtracting the tray. Mirrors React/Svelte
// `SortableGridBody`.
defineProps({ grid: Array, onGridChange: Function, tray: Array });

const { width, setRef } = useContainerWidth({
  initialWidth: STAGE_WIDTH - INTEROP_TRAY_W - INTEROP_GAP,
});

// `accept` here is consumed by the GRID (called directly), not by dnd-kit's `toValue` —
// so it stays a bare predicate, unlike a droppable's `accept`.
const options = {
  gridConfig: INTEROP_GRID,
  isResizable: false,
  accept: (s) => s.type === "tray-card",
};

const rowStyle = `display:flex;gap:${INTEROP_GAP}px;align-items:flex-start`;
const trayStyle = `width:${INTEROP_TRAY_W}px;flex:0 0 auto;display:flex;flex-direction:column`;
</script>

<template>
  <div class="dg-interop" :style="rowStyle">
    <div class="dg-tray" :style="trayStyle">
      <span style="font-size:11px;font-weight:600;color:var(--dg-muted);margin-bottom:6px">Widgets</span>
      <TrayCard v-for="(id, i) in tray" :key="id" :id="id" :index="i" />
    </div>
    <!-- Measure this flex slot; the grid surface fills it. -->
    <div style="flex:1 1 auto;min-width:0" :ref="setRef">
      <HeadlessGridHost
        :layout="grid"
        :width="width"
        :onLayoutChange="onGridChange"
        :options="options"
      >
        <template #content="{ item }">
          <div class="dg-nest__tile">{{ item.i }}</div>
        </template>
      </HeadlessGridHost>
    </div>
  </div>
</template>
