<script setup>
import { useGridPlaceholder } from "@snapgridjs/vue";

// The landing-cell marker shown while a tile is dragged — useGridPlaceholder returns a
// computed with its position (or null when idle). Headless grids render their own.
// Mirrors the React `Placeholder` helper (demos.tsx) and the Svelte `GridPlaceholder`.
const props = defineProps({ group: String });

// Composables return refs, so destructure/keep the ref and let the template unwrap it.
const placeholder = useGridPlaceholder(props.group);
</script>

<template>
  <div
    v-if="placeholder"
    class="dg-placeholder"
    :style="`${placeholder.style}border:1px dashed var(--dg-accent);border-radius:9px;background:var(--dg-accent-soft);transition:transform 150ms ease, width 150ms ease, height 150ms ease;`"
  ></div>
</template>
