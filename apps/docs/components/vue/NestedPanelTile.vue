<script setup>
import { useContainerWidth, useGridItem } from "@snapgridjs/vue";
import { NESTED_INNER_GRID } from "./demo-config";
import HeadlessGridHost from "./HeadlessGridHost.vue";

// The outer "panel" tile, holding the inner grid. `setHandleRef` makes the panel drag
// only from its header — so grabbing an inner tile never drags the whole panel. The
// inner grid uses HeadlessGridHost (not HeadlessGrid) so it shares the outer grid's
// provider/manager — tiles can be dragged between the inner and outer grids; innermost-
// grid collision keeps an inner drag scoped to it. Mirrors React/Svelte.
const props = defineProps({
  id: String,
  group: String,
  inner: Array,
  onInnerChange: Function,
});

const { setRef, setHandleRef, style } = useGridItem({ id: props.id, group: props.group });
const { width: innerWidth, setRef: setInnerRef } = useContainerWidth({ initialWidth: 440 });

const innerOptions = { gridConfig: NESTED_INNER_GRID, isResizable: false };
</script>

<template>
  <div :ref="setRef" :style="style" class="dg-cell">
    <div class="dg-nest">
      <div :ref="setHandleRef" class="dg-nest__head">
        <span class="dg-grip">⠿</span> Nested board
      </div>
      <div class="dg-nest__body">
        <div :ref="setInnerRef">
          <HeadlessGridHost
            :layout="inner"
            :width="innerWidth"
            :onLayoutChange="onInnerChange"
            :options="innerOptions"
          >
            <template #content="{ item }">
              <div class="dg-nest__tile">{{ item.i }}</div>
            </template>
          </HeadlessGridHost>
        </div>
      </div>
    </div>
  </div>
</template>
