<script lang="ts">
  import { getDragDropManager } from "@dnd-kit/svelte";
  import type { Layout } from "@snapgridjs/core";
  import { type UseGridControllerOptions, createGridContainer } from "../../index.js";

  interface Props {
    id: string;
    layout: Layout;
    options?: Partial<UseGridControllerOptions>;
    onManager?: (manager: unknown) => void;
  }

  let { id, layout, options, onManager }: Props = $props();

  // Expose the shared manager so the test can dispatch synthetic operations through
  // its monitor (the same channel the engine binds to).
  // svelte-ignore state_referenced_locally
  onManager?.(getDragDropManager());

  const gridConfig = {
    cols: 12,
    rowHeight: 100,
    margin: [10, 10] as [number, number],
    containerPadding: [10, 10] as [number, number],
  };

  const container = createGridContainer(() => ({
    id,
    layout,
    width: 1210,
    gridConfig,
    ...options,
  }));
</script>

<div {@attach container.attach} style={container.style}></div>
