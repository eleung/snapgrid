<script lang="ts">
  import { createGridItem } from "../../index.js";

  let { id, group }: { id: string; group: string } = $props();

  // svelte-ignore state_referenced_locally
  const tile = createGridItem({ id, group });
</script>

<div class="headless-tile" data-grid-id={id} {@attach tile.attach} style={tile.style}>{id}</div>
