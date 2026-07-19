<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { Layout } from "@snapgridjs/core";
  import HeadlessContainer from "./HeadlessContainer.svelte";

  let { layout, width = 400 }: { layout: Layout; width?: number } = $props();
</script>

<DragDropProvider>
  <HeadlessContainer {layout} {width} />
</DragDropProvider>
