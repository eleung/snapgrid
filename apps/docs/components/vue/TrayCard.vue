<script setup>
import { useSortable } from "@dnd-kit/vue/sortable";
import { shallowRef } from "vue";

// A tray card — a plain dnd-kit sortable. It reorders live within the tray and, because it
// accepts grid tiles too, one can be dropped in. No isDragging opacity: dnd-kit clones the
// card for the float, so an opacity here would dim the preview. Mirrors React/Svelte
// `TrayCard`.
const props = defineProps({ id: String, index: Number });

const elRef = shallowRef(null);
const setRef = (el) => {
  elRef.value = el;
};

// `id`/`index` are passed as getters so the sortable tracks them; `accept` is an ARRAY
// (not a function), so it needs no getter wrap.
const { isDragging } = useSortable({
  id: () => props.id,
  index: () => props.index,
  group: "tray",
  type: "tray-card",
  accept: ["tray-card", "grid-item"],
  element: elRef,
});
</script>

<template>
  <div
    :ref="setRef"
    class="dg-tray__card"
    :data-dragging="isDragging || undefined"
    style="padding:9px 11px;margin-bottom:7px;border-radius:8px;background:var(--dg-card);border:1px solid var(--dg-line-strong);font-weight:600;font-size:13px;cursor:grab;touch-action:none;"
  >
    {{ id }}
  </div>
</template>
