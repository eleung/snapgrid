<script setup>
import { useContainerWidth } from "@snapgridjs/vue";
import { shallowRef } from "vue";
import DemoTile from "./DemoTile.vue";
import { HERO, HERO_ACCENT } from "./demo-config";
import HeadlessGrid from "./HeadlessGrid.vue";

// The home-page hero grid, Vue edition — the same headless composition + `.dg-*` look as
// the React `HeroGrid` / Svelte `SvelteHeroGrid`, mounted as a client island when Vue is
// the selected framework.
const layout = shallowRef(HERO);
const { width, setRef } = useContainerWidth({ initialWidth: 563 });

const options = {
  gridConfig: { cols: 12, rowHeight: 56, margin: [12, 12] },
  resizeConfig: { handles: ["se"] },
};
const onLayoutChange = (next) => {
  layout.value = next;
};
const isAccent = (id) => HERO_ACCENT.includes(id);
</script>

<template>
  <!-- Outer card carries the padding/border/dotted background; the INNER div is what
       useContainerWidth measures, so the grid surface is sized to the real width. -->
  <div class="dg-hero-grid">
    <div :ref="setRef">
      <HeadlessGrid
        :layout="layout"
        :width="width"
        :onLayoutChange="onLayoutChange"
        :options="options"
        resizable
      >
        <template #content="{ item }">
          <DemoTile :label="item.i" :accent="isAccent(item.i)" />
        </template>
      </HeadlessGrid>
    </div>
  </div>
</template>
