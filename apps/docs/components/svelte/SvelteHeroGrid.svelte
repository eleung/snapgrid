<script lang="ts">
  import { type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import DemoTile from "./DemoTile.svelte";
  import { HERO, HERO_ACCENT } from "./demo-config";
  import HeadlessGrid from "./HeadlessGrid.svelte";

  // The home-page hero grid, Svelte edition — the same headless composition + `.dg-*`
  // look as the React `HeroGrid`, mounted as a client island when Svelte is selected.
  let layout = $state<Layout>(HERO);
  const width = createContainerWidth({ initialWidth: 563 });
</script>

<!-- Outer card carries the padding/border/dotted background; the INNER div is what
     createContainerWidth measures, so the grid surface is sized to the real width. -->
<div class="dg-hero-grid">
  <div {@attach width.attach}>
    <HeadlessGrid
      {layout}
      width={width.width}
      onLayoutChange={(next) => (layout = next)}
      options={{
        gridConfig: { cols: 12, rowHeight: 56, margin: [12, 12] },
        resizeConfig: { handles: ["se"] },
      }}
      resizable
    >
      {#snippet content(it)}
        <DemoTile label={it.i} accent={HERO_ACCENT.includes(it.i)} />
      {/snippet}
    </HeadlessGrid>
  </div>
</div>
