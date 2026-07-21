<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { Layout } from "@snapgridjs/core";
  import type { UseGridControllerOptions } from "../../index.js";
  import DragBoard from "./DragBoard.svelte";

  interface Board {
    id: string;
    layout: Layout;
    options?: Partial<UseGridControllerOptions>;
  }

  interface Props {
    a: Board;
    b: Board;
    onManager?: (manager: unknown) => void;
  }

  let { a, b, onManager }: Props = $props();
</script>

<!-- Two grids sharing one manager (the cross-grid seam). -->
<DragDropProvider>
  <DragBoard id={a.id} layout={a.layout} options={a.options} {onManager} />
  <DragBoard id={b.id} layout={b.layout} options={b.options} />
</DragDropProvider>
