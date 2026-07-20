<script lang="ts">
  import { createGridItem } from "@snapgridjs/svelte";
  import ArchiveZone from "./ArchiveZone.svelte";

  // The static grid tile that hosts the (non-grid) Archive drop zone. Mirrors React.
  let {
    id,
    group,
    archived,
    onRestore,
  }: { id: string; group: string; archived: string[]; onRestore: (id: string) => void } = $props();

  // svelte-ignore state_referenced_locally
  const tile = createGridItem({ id, group });
</script>

<div {@attach tile.attach} style={tile.style} class="dg-cell">
  <ArchiveZone {archived} {onRestore} />
</div>
