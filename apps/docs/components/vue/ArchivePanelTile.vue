<script setup>
import { useGridItem } from "@snapgridjs/vue";
import ArchiveZone from "./ArchiveZone.vue";

// The static grid tile that hosts the (non-grid) Archive drop zone. Mirrors React/Svelte.
const props = defineProps({
  id: String,
  group: String,
  archived: Array,
  onRestore: Function,
});

const { setRef, style } = useGridItem({ id: props.id, group: props.group });
</script>

<template>
  <div :ref="setRef" :style="style" class="dg-cell">
    <ArchiveZone :archived="archived" :onRestore="onRestore" />
  </div>
</template>
