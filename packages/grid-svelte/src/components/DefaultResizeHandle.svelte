<script lang="ts">
  import type { ResizeHandleAxis } from "@snapgridjs/core";
  import { createGridResizeHandle } from "../hooks/createGridResizeHandle.svelte.js";
  import { handleStyle } from "../handleStyle.js";

  interface Props {
    itemId: string;
    handle: ResizeHandleAxis;
    group: string;
  }

  let { itemId, handle, group }: Props = $props();

  // Identity props, immutable per instance (handles are keyed by axis).
  // svelte-ignore state_referenced_locally
  const resize = createGridResizeHandle({ id: itemId, handle, group });
</script>

<span
  {@attach resize.attach}
  {...resize.handleProps}
  class="snapgrid-resize-handle snapgrid-resize-handle--{handle}"
  style={handleStyle(handle)}
></span>
