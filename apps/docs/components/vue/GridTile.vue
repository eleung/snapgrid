<script setup>
import { useGridItem } from "@snapgridjs/vue";
import { computed } from "vue";
import ResizeHandle from "./ResizeHandle.vue";

// A single positioned grid tile: applies useGridItem's setRef + style to a wrapper that
// holds whatever content the demo rendered, plus a resize handle. `dg-cell` is the
// demo's own hook for styling/tests — headless tiles carry no class from the library.
// Mirrors the React / Svelte `GridTile` helper.
const props = defineProps({
  id: String,
  group: String,
  resizable: { type: Boolean, default: false },
});

const { setRef, style, isDragging, item } = useGridItem({ id: props.id, group: props.group });

// Match the library's per-item gating: static or isResizable:false → no handle.
const showHandle = computed(
  () =>
    props.resizable && !!item.value && !item.value.static && item.value.isResizable !== false,
);
</script>

<template>
  <div :ref="setRef" :style="style" class="dg-cell" :data-dragging="isDragging || undefined">
    <slot />
    <ResizeHandle v-if="showHandle" :id="id" :group="group" />
  </div>
</template>
