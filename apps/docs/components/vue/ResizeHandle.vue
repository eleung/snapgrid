<script setup>
import { useGridResizeHandle } from "@snapgridjs/vue";

// A bottom-right resize handle, modelled as its own draggable via useGridResizeHandle.
// `handleProps` keeps a pointer-down on it from starting an item drag; CSS (`.dg-rh`)
// places + styles it. Mirrors the React / Svelte `ResizeHandle`.
const props = defineProps({ id: String, group: String });

const { setRef, handleProps } = useGridResizeHandle({
  id: props.id,
  handle: "se",
  group: props.group,
});
</script>

<template>
  <span :ref="setRef" v-bind="handleProps" class="dg-rh dg-rh--se"></span>
</template>
