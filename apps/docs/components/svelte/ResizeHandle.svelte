<script lang="ts">
  import { createGridResizeHandle } from "@snapgridjs/svelte";

  // A bottom-right resize handle, modelled as its own draggable via
  // createGridResizeHandle. `handleProps` keeps a pointer-down on it from starting
  // an item drag; CSS (`.dg-rh`) places + styles it. Mirrors the React `ResizeHandle`.
  let { id, group }: { id: string; group: string } = $props();

  // svelte-ignore state_referenced_locally
  const handle = createGridResizeHandle({ id, handle: "se", group });
</script>

<span {@attach handle.attach} {...handle.handleProps} class="dg-rh dg-rh--se"></span>
