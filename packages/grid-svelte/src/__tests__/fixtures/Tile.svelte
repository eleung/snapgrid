<script lang="ts">
  import { createGridItem } from "../../index.js";

  let { id, group }: { id: string; group: string } = $props();

  // svelte-ignore state_referenced_locally
  const tile = createGridItem({ id, group });
</script>

<!-- data-tile-style re-states the style string: jsdom drops `touch-action` (which its
     CSSStyleDeclaration does not implement) when it parses the style attribute. -->
<div
  class="headless-tile"
  data-grid-id={id}
  data-tile-style={tile.style}
  {@attach tile.attach}
  style={tile.style}
>{id}</div>
