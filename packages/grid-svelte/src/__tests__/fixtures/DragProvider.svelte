<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { Layout } from "@snapgridjs/core";
  import type { UseGridControllerOptions } from "../../index.js";
  import DragBoard from "./DragBoard.svelte";

  interface Props {
    id: string;
    layout: Layout;
    options?: Partial<UseGridControllerOptions>;
    onManager?: (manager: unknown) => void;
  }

  let { id, layout, options, onManager }: Props = $props();
</script>

<DragDropProvider>
  <DragBoard {id} {layout} {options} {onManager} />
</DragDropProvider>
