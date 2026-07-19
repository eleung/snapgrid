<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { Snippet } from "svelte";
  import { isInProvider, markInProvider } from "../context.js";

  // Share one dnd-kit <DragDropProvider> across several sibling grids so tiles can be
  // dragged between them. (Nested <GridLayout>s already share a provider; this is for
  // siblings.) A thin wrapper — the cross-grid seam is the shared manager + collision
  // target. Honors a consumer's own enclosing provider.
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
