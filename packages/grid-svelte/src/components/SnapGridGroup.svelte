<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { Snippet } from "svelte";
  import { isInProvider, markInProvider } from "../context.js";

  // Share one dnd-kit <DragDropProvider> across several sibling grids so tiles can be
  // dragged between them. (Nested <GridLayout>s already share a provider; this is for
  // siblings.) A thin wrapper — the cross-grid seam is the shared manager + collision
  // target. Nested inside another snapgrid provider it adds none; a plain
  // <DragDropProvider> of your own isn't detected, so use the headless layer to share one.
  let { children }: { children: Snippet } = $props();

  const inProvider = isInProvider();
  if (!inProvider) markInProvider();
</script>

{#if inProvider}
  {@render children()}
{:else}
  <DragDropProvider>
    {@render children()}
  </DragDropProvider>
{/if}
