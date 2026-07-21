<script lang="ts">
  // The neutral demo tile — mirrors the React `Tile` (DemoFrame.tsx) and its
  // `.dg-tile` styling in styles/globals.css: a paper card with a mono label and the
  // item's size, plus accent/static variants. Using the same global classes keeps
  // the /svelte gallery pixel-identical to /react instead of a bespoke look.
  let {
    label,
    meta,
    accent = false,
    isStatic = false,
  }: { label: string; meta?: string; accent?: boolean; isStatic?: boolean } = $props();
</script>

<div
  class="dg-tile"
  class:dg-tile--accent={accent}
  class:dg-tile--static={isStatic}
  style="width:100%;height:100%;cursor:grab"
>
  <span class="dg-tile__label">{label}</span>
  {#if meta}<span class="dg-tile__meta">{meta}</span>{/if}
</div>
