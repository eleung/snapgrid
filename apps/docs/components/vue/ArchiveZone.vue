<script setup>
import {
  SNAPGRID_DROPPABLE_ATTR,
  nestedDropCollisionDetector,
  useDroppable,
} from "@snapgridjs/vue";
import { computed, shallowRef } from "vue";
import { ARCHIVE_ZONE_ID } from "./demo-config";

// The nested drop zone: a plain useDroppable that outranks the grid it sits in. The
// collision detector is what makes it win; the marker attribute is only for droppables
// you'd nest INSIDE it (harmless here). Mirrors the React/Svelte `ArchiveZone`.
const props = defineProps({ archived: Array, onRestore: Function });

const elRef = shallowRef(null);
const setRef = (el) => {
  elRef.value = el;
};

const acceptGridItem = (s) => s.type === "grid-item";

const { isDropTarget } = useDroppable({
  id: ARCHIVE_ZONE_ID,
  // dnd-kit's Vue adapter resolves every input with `toValue()`, which CALLS a bare
  // function as a getter — so an input whose VALUE is a function must be wrapped.
  accept: () => acceptGridItem,
  collisionDetector: () => nestedDropCollisionDetector,
  element: elRef,
});

const markerAttrs = { [SNAPGRID_DROPPABLE_ATTR]: "" };

const zoneStyle = computed(
  () =>
    `height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;border-radius:10px;border:2px dashed ${isDropTarget.value ? "var(--dg-accent)" : "var(--dg-line-strong)"};background:${isDropTarget.value ? "var(--dg-accent-soft)" : "transparent"};color:${isDropTarget.value ? "var(--dg-accent)" : "var(--dg-muted)"};transition:background 120ms, border-color 120ms, color 120ms`,
);

const hint = computed(() => {
  if (isDropTarget.value) return "release to archive";
  return props.archived.length ? "click a tile to restore" : "drag a tile here";
});
</script>

<template>
  <div :ref="setRef" v-bind="markerAttrs" :style="zoneStyle">
    <span style="font-weight:600">Archive</span>
    <span style="font-size:12px">{{ hint }}</span>
    <div
      v-if="archived.length"
      style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center"
    >
      <button
        v-for="tileId in archived"
        :key="tileId"
        type="button"
        style="font:inherit;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;cursor:pointer;color:var(--dg-accent);background:var(--dg-accent-soft);border:1px solid var(--dg-accent)"
        @click="onRestore(tileId)"
      >
        {{ tileId.toUpperCase() }}
      </button>
    </div>
  </div>
</template>
