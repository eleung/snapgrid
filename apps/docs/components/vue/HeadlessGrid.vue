<script setup>
import { DragDropProvider } from "@snapgridjs/vue";
import HeadlessGridHost from "./HeadlessGridHost.vue";

// The headless wiring every single-grid demo shares: a dnd-kit DragDropProvider wrapping
// the grid host. The provider is the OUTERMOST element — useGridContainer must run inside
// it (it registers the grid's controller on the provider's manager) AND Vue resolves
// `inject` from the parent chain, so the host lives in a child component, never in this
// one. Mirrors the React/Svelte `HeadlessGrid`.
defineProps({
  layout: Array,
  width: Number,
  onLayoutChange: Function,
  options: Object,
  resizable: { type: Boolean, default: false },
  id: String,
  isCustom: Function,
});
</script>

<template>
  <DragDropProvider>
    <HeadlessGridHost v-bind="$props">
      <!-- Forward only the slots this demo actually supplied: the host falls back to its
           default tile/content when a slot is absent, so an always-present (but empty)
           forwarded slot would blank the tiles. -->
      <template v-if="$slots.tile" #tile="slotProps">
        <slot name="tile" v-bind="slotProps" />
      </template>
      <template v-if="$slots.content" #content="slotProps">
        <slot name="content" v-bind="slotProps" />
      </template>
    </HeadlessGridHost>
  </DragDropProvider>
</template>
