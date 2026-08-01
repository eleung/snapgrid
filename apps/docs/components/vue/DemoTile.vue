<script setup>
// The neutral demo tile — mirrors the React `Tile` (DemoFrame.tsx) / Svelte `DemoTile`
// and their `.dg-tile` styling in styles/globals.css: a paper card with a mono label
// and the item's size, plus accent/static variants. Using the same global classes keeps
// the /vue gallery pixel-identical to /react and /svelte instead of a bespoke look.
defineProps({
  label: String,
  meta: String,
  accent: { type: Boolean, default: false },
  isStatic: { type: Boolean, default: false },
});
</script>

<template>
  <div
    class="dg-tile"
    :class="{ 'dg-tile--accent': accent, 'dg-tile--static': isStatic }"
    style="width:100%;height:100%;cursor:grab"
  >
    <span class="dg-tile__label">{{ label }}</span>
    <span v-if="meta" class="dg-tile__meta">{{ meta }}</span>
  </div>
</template>
