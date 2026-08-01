<script setup>
import { useContainerWidth, useResponsiveLayout } from "@snapgridjs/vue";
import { computed, onUnmounted, ref, shallowRef } from "vue";
import DemoTile from "./DemoTile.vue";
import { RESP, RESP_BREAKPOINTS, RESP_COLS, RESP_MIN, STAGE_WIDTH } from "./demo-config";
import HeadlessGrid from "./HeadlessGrid.vue";

// Columns + layout switch by breakpoint as the preview width changes. Drag the right
// edge to resize the preview (or use the presets). Headless responsive: resolve the
// active breakpoint's columns + layout from the preview width (the same engine the
// turnkey ResponsiveGridLayout uses), then feed them into the shared HeadlessGrid —
// like every other demo. Mirrors the React/Svelte responsive demo.
// Destructure every composable result: Vue only auto-unwraps TOP-LEVEL setup bindings
// in the template, so `avail.width` would stay a raw Ref.
const { width: availWidth, setRef: setAvailRef } = useContainerWidth({
  initialWidth: STAGE_WIDTH,
});
const layouts = shallowRef(RESP);
// Infinity = "as wide as the stage allows" (clamped to `max`), so the demo opens
// truly Large. Dragging or Small/Medium replaces it with a concrete width.
const requested = ref(Number.POSITIVE_INFINITY);
let drag = null;

const max = computed(() => Math.max(RESP_MIN, Math.round(availWidth.value)));
const previewW = computed(() => Math.min(Math.max(requested.value, RESP_MIN), max.value));

// Options are a GETTER so the engine tracks the live preview width + layouts.
const { cols, layout: respLayout, onLayoutChange } = useResponsiveLayout(() => ({
  width: previewW.value,
  layouts: layouts.value,
  breakpoints: RESP_BREAKPOINTS,
  cols: RESP_COLS,
  onLayoutChange: (_active, all) => {
    layouts.value = all;
  },
}));

const gridOptions = computed(() => ({
  gridConfig: {
    cols: cols.value,
    rowHeight: 48,
    margin: [10, 10],
    containerPadding: [10, 10],
  },
}));

// A preset is hidden when its target width can't fit the stage (it would clamp to full
// and duplicate Large). The active preset is derived so the buckets stay mutually
// exclusive: Large is the catch-all and wins at full width.
const showSmall = computed(() => max.value >= 300);
const showMedium = computed(() => max.value >= 420);
const atFull = computed(() => previewW.value >= max.value);
const active = computed(() =>
  !atFull.value && showSmall.value && previewW.value < 360
    ? "small"
    : !atFull.value && showMedium.value && previewW.value < 480
      ? "medium"
      : "large",
);

// Preset handlers (kept out of the template so the expression compiler never has to
// resolve a global or rewrite a ref assignment inline).
const setSmall = () => {
  requested.value = 300;
};
const setMedium = () => {
  requested.value = 420;
};
const setLarge = () => {
  requested.value = Number.POSITIVE_INFINITY;
};

function onDown(e) {
  e.preventDefault();
  drag = { x: e.clientX, w: previewW.value };
  e.currentTarget.setPointerCapture(e.pointerId);
  // Suppress text selection on the page while dragging.
  document.body.style.userSelect = "none";
}
function onMove(e) {
  if (drag) requested.value = drag.w + (e.clientX - drag.x);
}
// Used for both pointerup and pointercancel so the page-wide selection lock is always released.
function onUp(e) {
  drag = null;
  document.body.style.userSelect = "";
  const el = e.currentTarget;
  if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
}
// Restore the selection lock if we unmount mid-drag.
onUnmounted(() => {
  if (drag) document.body.style.userSelect = "";
});
</script>

<template>
  <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.8rem">
    <button
      v-if="showSmall"
      type="button"
      class="dg-btn"
      :data-active="active === 'small' || undefined"
      @click="setSmall"
    >
      Small
    </button>
    <button
      v-if="showMedium"
      type="button"
      class="dg-btn"
      :data-active="active === 'medium' || undefined"
      @click="setMedium"
    >
      Medium
    </button>
    <button
      type="button"
      class="dg-btn"
      :data-active="active === 'large' || undefined"
      @click="setLarge"
    >
      Large
    </button>
  </div>
  <div :ref="setAvailRef">
    <div class="dg-resize" :style="`width:${previewW}px`">
      <HeadlessGrid
        :layout="respLayout"
        :width="previewW"
        :onLayoutChange="onLayoutChange"
        :options="gridOptions"
      >
        <template #content="{ item }">
          <DemoTile :label="item.i.toUpperCase()" />
        </template>
      </HeadlessGrid>
      <div
        class="dg-resize__handle"
        title="Drag to resize"
        aria-hidden="true"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      ></div>
    </div>
  </div>
</template>
