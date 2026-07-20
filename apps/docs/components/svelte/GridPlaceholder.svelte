<script lang="ts">
  import { createGridPlaceholder } from "@snapgridjs/svelte";

  // The landing-cell marker shown while a tile is dragged — createGridPlaceholder
  // returns its position (or null when idle). Headless grids render their own.
  // Mirrors the React `Placeholder` helper (demos.tsx).
  let { group }: { group: string } = $props();

  // svelte-ignore state_referenced_locally
  const placeholder = createGridPlaceholder(group);
</script>

{#if placeholder.current}
  <div
    class="dg-placeholder"
    style={`${placeholder.current.style}border:1px dashed var(--dg-accent);border-radius:9px;background:var(--dg-accent-soft);transition:transform 150ms ease, width 150ms ease, height 150ms ease;`}
  ></div>
{/if}
