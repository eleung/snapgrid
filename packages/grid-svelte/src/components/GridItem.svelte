<script lang="ts">
  import type { Snippet } from "svelte";
  import { getGridContext } from "../context.js";
  import { createGridItem } from "../hooks/createGridItem.svelte.js";
  import DefaultResizeHandle from "./DefaultResizeHandle.svelte";

  interface Props {
    /** Matches the layout item's `i`. */
    id: string;
    /** The owning grid's id (from its createGridContainer). */
    group: string;
    /** The tile's content. */
    children?: Snippet;
    /** Appended to the default `snapgrid-item` class. */
    class?: string;
    /** Merged after (and able to override) the positioning style. */
    style?: string;
  }

  let { id, group, children, class: className, style: styleOverride }: Props = $props();

  // `id` and `group` are immutable per instance — tiles are keyed by `i` and a
  // grid's group id is stable — so capturing them once at init is correct.
  // svelte-ignore state_referenced_locally
  const tile = createGridItem({ id, group });
  // svelte-ignore state_referenced_locally
  const { controller, version } = getGridContext(group);

  const handles = $derived.by(() => {
    version();
    const config = controller.config;
    return config?.isItemResizable(id) ? config.resizeHandlesFor(id) : [];
  });
</script>

<div
  {@attach tile.attach}
  data-grid-id={id}
  data-dragging={tile.isDragging || undefined}
  class={className ? `snapgrid-item ${className}` : "snapgrid-item"}
  style={styleOverride ? `${tile.style} ${styleOverride}` : tile.style}
>
  {@render children?.()}
  {#each handles as handle (handle)}
    <DefaultResizeHandle itemId={id} {handle} {group} />
  {/each}
</div>
