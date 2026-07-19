<script lang="ts">
  import { createGridPlaceholder } from "../hooks/createGridPlaceholder.svelte.js";
  import { REFLOW_TRANSITION } from "../reflow.js";

  interface Props {
    /** The owning grid's id (from its createGridContainer). */
    group: string;
    /** Appended to the default `snapgrid-placeholder` class. */
    class?: string;
    /** Merged after (and able to override) the default look. */
    style?: string;
  }

  let { group, class: className, style: styleOverride }: Props = $props();

  // `group` is the stable grid id for this placeholder's lifetime.
  // svelte-ignore state_referenced_locally
  const placeholder = createGridPlaceholder(group);

  const DEFAULT_LOOK = `background: rgba(99, 102, 241, 0.2); border: 1px dashed rgba(99, 102, 241, 0.6); border-radius: 4px; box-sizing: border-box; z-index: 2; transition: ${REFLOW_TRANSITION};`;
</script>

{#if placeholder.current}
  <div
    aria-hidden="true"
    class={className ? `snapgrid-placeholder ${className}` : "snapgrid-placeholder"}
    style="{placeholder.current.style} {DEFAULT_LOOK}{styleOverride ? ` ${styleOverride}` : ''}"
  ></div>
{/if}
