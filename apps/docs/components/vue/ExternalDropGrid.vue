<script setup>
import { SnapGridGroup } from "@snapgridjs/vue";
import { shallowRef } from "vue";
import { PALETTE } from "./demo-config";
import DropTargetGrid from "./DropTargetGrid.vue";
import PaletteChip from "./PaletteChip.vue";

// A palette of draggable chips beside a drop-enabled grid, under one shared provider
// (SnapGridGroup) so a chip can be dropped into the grid — which synthesizes a new item of
// the chip's size. Mirrors the React/Svelte external-drop demo.
const layout = shallowRef([{ i: "seed", x: 0, y: 0, w: 3, h: 2 }]);

const onLayoutChange = (next) => {
  layout.value = next;
};
</script>

<template>
  <SnapGridGroup>
    <div class="dg-gridrow">
      <div class="dg-subgrid dg-subgrid--auto">
        <span class="dg-subgrid__label">Palette</span>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <PaletteChip
            v-for="c in PALETTE"
            :key="c.id"
            :id="c.id"
            :label="c.label"
            :w="c.w"
            :h="c.h"
          />
        </div>
      </div>
      <DropTargetGrid :layout="layout" :onLayoutChange="onLayoutChange" />
    </div>
  </SnapGridGroup>
</template>
