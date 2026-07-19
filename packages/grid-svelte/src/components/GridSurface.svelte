<script lang="ts">
  import type { GridLayoutProps } from "../props.js";
  import { createGridContainer } from "../hooks/createGridContainer.svelte.js";
  import GridItem from "./GridItem.svelte";
  import GridPlaceholder from "./GridPlaceholder.svelte";

  // Display props are peeled off; the rest are the controller options, passed as a
  // reactive getter so width/layout/config changes flow through.
  let { class: className, style: styleOverride, item, ...opts }: GridLayoutProps = $props();

  const container = createGridContainer(() => opts);
</script>

<div
  {@attach container.attach}
  class={className ? `snapgrid ${className}` : "snapgrid"}
  style={styleOverride ? `${container.style} ${styleOverride}` : container.style}
  data-drop-target={container.isDropTarget || undefined}
>
  {#each opts.layout as layoutItem (layoutItem.i)}
    <GridItem id={layoutItem.i} group={container.group}>
      {@render item(layoutItem)}
    </GridItem>
  {/each}
  <GridPlaceholder group={container.group} />
</div>
