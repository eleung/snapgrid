<script lang="ts">
  import { type DragSourceInfo, type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import { INTEROP_GAP, INTEROP_GRID, INTEROP_TRAY_W, STAGE_WIDTH } from "./demo-config";
  import HeadlessGridHost from "./HeadlessGridHost.svelte";
  import TrayCard from "./TrayCard.svelte";

  // Rendered inside the provider so createGridContainer resolves the shared manager.
  // Measures the grid's OWN flex slot (beside the fixed-width tray) so its width feeds
  // the grid directly — no measuring the whole row and subtracting the tray. Mirrors
  // React `SortableGridBody`.
  let { grid, onGridChange, tray }: { grid: Layout; onGridChange: (next: Layout) => void; tray: string[] } =
    $props();

  const width = createContainerWidth({ initialWidth: STAGE_WIDTH - INTEROP_TRAY_W - INTEROP_GAP });
</script>

<div class="dg-interop" style={`display:flex;gap:${INTEROP_GAP}px;align-items:flex-start`}>
  <div
    class="dg-tray"
    style={`width:${INTEROP_TRAY_W}px;flex:0 0 auto;display:flex;flex-direction:column`}
  >
    <span style="font-size:11px;font-weight:600;color:var(--dg-muted);margin-bottom:6px">Widgets</span>
    {#each tray as id, i (id)}
      <TrayCard {id} index={i} />
    {/each}
  </div>
  <!-- Measure this flex slot; the grid surface fills it. -->
  <div style="flex:1 1 auto;min-width:0" {@attach width.attach}>
    <HeadlessGridHost
      layout={grid}
      width={width.width}
      onLayoutChange={onGridChange}
      options={{
        gridConfig: INTEROP_GRID,
        isResizable: false,
        accept: (s: DragSourceInfo) => s.type === "tray-card",
      }}
    >
      {#snippet content(it)}
        <div class="dg-nest__tile">{it.i}</div>
      {/snippet}
    </HeadlessGridHost>
  </div>
</div>
