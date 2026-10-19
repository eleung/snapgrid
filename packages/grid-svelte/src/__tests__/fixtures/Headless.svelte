<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { Layout } from "@snapgridjs/core";
  import type { DragConfig } from "@snapgridjs/dnd";
  import HeadlessContainer from "./HeadlessContainer.svelte";

  let {
    layout,
    width = 400,
    dragConfig,
  }: { layout: Layout; width?: number; dragConfig?: DragConfig } = $props();
</script>

<DragDropProvider>
  <HeadlessContainer {layout} {width} {dragConfig} />
</DragDropProvider>
