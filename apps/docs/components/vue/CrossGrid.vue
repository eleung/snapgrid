<script setup>
import { SnapGridGroup } from "@snapgridjs/vue";
import { shallowRef } from "vue";
import CrossSubGrid from "./CrossSubGrid.vue";
import { LEFT, RIGHT } from "./demo-config";

// Two grids under one <SnapGridGroup> (which supplies the shared DragDropProvider): drag
// tiles between them. The dragged tile floats itself across both grids. The sub-grids are
// slot children of the group, so they mount inside the provider and inject its manager.
const left = shallowRef(LEFT);
const right = shallowRef(RIGHT);

const onLeftChange = (next) => {
  left.value = next;
};
const onRightChange = (next) => {
  right.value = next;
};
</script>

<template>
  <SnapGridGroup>
    <div class="dg-gridrow">
      <CrossSubGrid label="Grid A" :layout="left" :onLayoutChange="onLeftChange" />
      <CrossSubGrid label="Grid B" :layout="right" :onLayoutChange="onRightChange" />
    </div>
  </SnapGridGroup>
</template>
