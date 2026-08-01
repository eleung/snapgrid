<script setup>
import { Feedback, useDraggable } from "@snapgridjs/vue";
import { shallowRef } from "vue";

// A plain dnd-kit draggable carrying a `snapGridDrop` size payload; a grid with dropConfig
// enabled synthesizes an item of this size when it's dropped in. The `clone` feedback
// leaves the chip in place and drags a copy. Shared `.dg-chip` look. Mirrors the React /
// Svelte `PaletteChip`. Imported from @snapgridjs/vue (not @dnd-kit/vue) so it shares
// snapgrid's single dnd-kit instance.
const props = defineProps({ id: String, label: String, w: Number, h: Number });

// dnd-kit's Vue adapter takes the element as an input ref, not a returned setter.
const elRef = shallowRef(null);
const setRef = (el) => {
  elRef.value = el;
};

useDraggable({
  id: props.id,
  data: { snapGridDrop: { w: props.w, h: props.h } },
  // A plain array, not the callback form — no getter wrap needed.
  plugins: [Feedback.configure({ feedback: "clone" })],
  element: elRef,
});
</script>

<template>
  <div :ref="setRef" class="dg-chip">
    {{ label }}
    <small>{{ w }}×{{ h }}</small>
  </div>
</template>
