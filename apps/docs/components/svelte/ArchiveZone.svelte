<script lang="ts">
  import {
    type DragSourceInfo,
    SNAPGRID_DROPPABLE_ATTR,
    createDroppable,
    nestedDropCollisionDetector,
  } from "@snapgridjs/svelte";
  import { ARCHIVE_ZONE_ID } from "./demo-config";

  // The nested drop zone: a plain createDroppable that outranks the grid it sits in.
  // The collision detector is what makes it win; the marker attribute is only for
  // droppables you'd nest INSIDE it (harmless here). Mirrors the React `ArchiveZone`.
  let { archived, onRestore }: { archived: string[]; onRestore: (id: string) => void } = $props();

  const zone = createDroppable({
    id: ARCHIVE_ZONE_ID,
    accept: (s: DragSourceInfo) => s.type === "grid-item",
    collisionDetector: nestedDropCollisionDetector,
  });
</script>

<div
  {@attach zone.attach}
  {...{ [SNAPGRID_DROPPABLE_ATTR]: "" }}
  style={`height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;border-radius:10px;border:2px dashed ${zone.isDropTarget ? "var(--dg-accent)" : "var(--dg-line-strong)"};background:${zone.isDropTarget ? "var(--dg-accent-soft)" : "transparent"};color:${zone.isDropTarget ? "var(--dg-accent)" : "var(--dg-muted)"};transition:background 120ms, border-color 120ms, color 120ms`}
>
  <span style="font-weight:600">Archive</span>
  <span style="font-size:12px">
    {zone.isDropTarget
      ? "release to archive"
      : archived.length
        ? "click a tile to restore"
        : "drag a tile here"}
  </span>
  {#if archived.length}
    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
      {#each archived as tileId (tileId)}
        <button
          type="button"
          onclick={() => onRestore(tileId)}
          style="font:inherit;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;cursor:pointer;color:var(--dg-accent);background:var(--dg-accent-soft);border:1px solid var(--dg-accent)"
        >
          {tileId.toUpperCase()}
        </button>
      {/each}
    </div>
  {/if}
</div>
