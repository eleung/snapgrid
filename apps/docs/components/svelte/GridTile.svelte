<script lang="ts">
  import { createGridItem } from "@snapgridjs/svelte";
  import type { Snippet } from "svelte";
  import ResizeHandle from "./ResizeHandle.svelte";

  // A single positioned grid tile: applies createGridItem's attach + style to a
  // wrapper that holds whatever content the demo rendered, plus a resize handle.
  // `dg-cell` is the demo's own hook for styling/tests — headless tiles carry no
  // class from the library. Mirrors the React `GridTile` helper.
  let {
    id,
    group,
    resizable = false,
    children,
  }: { id: string; group: string; resizable?: boolean; children: Snippet } = $props();

  // svelte-ignore state_referenced_locally
  const tile = createGridItem({ id, group });
  // Match the library's per-item gating: static or isResizable:false → no handle.
  const showHandle = $derived(
    resizable && !!tile.item && !tile.item.static && tile.item.isResizable !== false,
  );
</script>

<div {@attach tile.attach} style={tile.style} class="dg-cell" data-dragging={tile.isDragging || undefined}>
  {@render children()}
  {#if showHandle}<ResizeHandle {id} {group} />{/if}
</div>
