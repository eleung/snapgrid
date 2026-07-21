<script lang="ts">
  import {
    DragDropProvider,
    type Layout,
    createContainerWidth,
    insertItemWithCompactor,
    removeItemWithCompactor,
    verticalCompactor,
  } from "@snapgridjs/svelte";
  import ArchivePanelTile from "./ArchivePanelTile.svelte";
  import { ARCHIVE_ZONE_ID, DROPZONE_INIT, GRID, STAGE_WIDTH } from "./demo-config";
  import HeadlessGridHost from "./HeadlessGridHost.svelte";

  // A grid whose right-hand "Archive" panel is a plain (non-grid) droppable that opts
  // into snapgrid's depth ranking, so a tile dragged over it resolves to the ZONE, not
  // the grid underneath: the grid backs off (reverts the tile) and the zone lights up.
  // The drop archives the tile (removing it + re-packing the hole); click a chip to
  // restore. Mirrors the React nested-drop-zone demo.
  let layout = $state<Layout>(DROPZONE_INIT);
  let archived = $state<string[]>([]);
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });

  // Restore an archived tile: drop it back into the grid (re-packing). All tiles 4×2.
  function restore(id: string) {
    layout = insertItemWithCompactor(layout, { i: id, x: 0, y: 0, w: 4, h: 2 }, 0, 0, {
      compactor: verticalCompactor,
      cols: GRID.cols,
    });
    archived = archived.filter((x) => x !== id);
  }

  // biome-ignore lint/suspicious/noExplicitAny: dnd-kit event type.
  function onDragEnd(event: any) {
    // The zone won the collision, so it's the resolved target; the grid reverted the
    // tile. Archive it: pull it out of the grid (re-packing the hole) and add its chip.
    const { source, target } = event.operation;
    if (target?.id === ARCHIVE_ZONE_ID && source?.type === "grid-item") {
      const id = String(source.id);
      layout = removeItemWithCompactor(layout, id, {
        compactor: verticalCompactor,
        cols: GRID.cols,
      });
      archived = archived.includes(id) ? archived : [...archived, id];
    }
  }
</script>

<div {@attach width.attach}>
  <DragDropProvider {onDragEnd}>
    <HeadlessGridHost
      {layout}
      width={width.width}
      onLayoutChange={(next) => (layout = next)}
      options={{ gridConfig: GRID, isResizable: false }}
      isCustom={(it) => it.i === "archive"}
    >
      {#snippet tile(item, group)}
        <ArchivePanelTile id={item.i} {group} {archived} onRestore={restore} />
      {/snippet}
    </HeadlessGridHost>
  </DragDropProvider>
</div>
