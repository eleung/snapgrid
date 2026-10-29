/** @jsxImportSource solid-js */
import { useGridItem } from "@snapgridjs/solid";
import { ArchiveZone } from "./ArchiveZone";

// The static grid tile that hosts the (non-grid) Archive drop zone. Mirrors
// React/Svelte/Vue.
export function ArchivePanelTile(props: {
  id: string;
  group: string;
  archived: string[];
  onRestore: (id: string) => void;
}) {
  const tile = useGridItem({ id: props.id, group: props.group });
  return (
    <div ref={tile.ref} style={tile.style()} class="dg-cell">
      <ArchiveZone archived={props.archived} onRestore={props.onRestore} />
    </div>
  );
}
