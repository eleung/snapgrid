<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { GridLayoutProps } from "../props.js";
  import { isInProvider, markInProvider } from "../context.js";
  import GridSurface from "./GridSurface.svelte";

  // Drop-in grid: a controlled, react-grid-layout v2-compatible layout backed by
  // dnd-kit. Supplies the dnd-kit <DragDropProvider> for the turnkey case (unless one
  // already exists above — nested grids and <SnapGridGroup> siblings share it, the
  // cross-grid seam). The surface itself lives in a child component so it initializes
  // *inside* the provider (else the manager context isn't resolvable).
  let props: GridLayoutProps = $props();

  const inProvider = isInProvider();
  if (!inProvider) markInProvider();
</script>

{#if inProvider}
  <GridSurface {...props} />
{:else}
  <DragDropProvider>
    <GridSurface {...props} />
  </DragDropProvider>
{/if}
