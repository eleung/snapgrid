<script lang="ts">
  import {
    type ResponsiveLayouts,
    createContainerWidth,
    createResponsiveLayout,
  } from "@snapgridjs/svelte";
  import DemoTile from "./DemoTile.svelte";
  import { RESP, RESP_BREAKPOINTS, RESP_COLS, RESP_MIN, STAGE_WIDTH } from "./demo-config";
  import HeadlessGrid from "./HeadlessGrid.svelte";

  // Columns + layout switch by breakpoint as the preview width changes. Drag the right
  // edge to resize the preview (or use the presets). Headless responsive: resolve the
  // active breakpoint's columns + layout from the preview width (the same engine the
  // turnkey ResponsiveGridLayout uses), then feed them into the shared HeadlessGrid —
  // like every other demo. Mirrors the React responsive demo.
  const avail = createContainerWidth({ initialWidth: STAGE_WIDTH });
  let layouts = $state<ResponsiveLayouts>(RESP);
  // Infinity = "as wide as the stage allows" (clamped to `max`), so the demo opens
  // truly Large. Dragging or Small/Medium replaces it with a concrete width.
  let requested = $state(Number.POSITIVE_INFINITY);
  let drag: { x: number; w: number } | null = null;

  const max = $derived(Math.max(RESP_MIN, Math.round(avail.width)));
  const previewW = $derived(Math.min(Math.max(requested, RESP_MIN), max));

  const resp = createResponsiveLayout(() => ({
    width: previewW,
    layouts,
    breakpoints: RESP_BREAKPOINTS,
    cols: RESP_COLS,
    onLayoutChange: (_active, all) => {
      layouts = all;
    },
  }));

  // A preset is hidden when its target width can't fit the stage (it would clamp to full
  // and duplicate Large). The active preset is derived so the buckets stay mutually
  // exclusive: Large is the catch-all and wins at full width.
  const showSmall = $derived(max >= 300);
  const showMedium = $derived(max >= 420);
  const atFull = $derived(previewW >= max);
  const active = $derived(
    !atFull && showSmall && previewW < 360
      ? "small"
      : !atFull && showMedium && previewW < 480
        ? "medium"
        : "large",
  );

  function onDown(e: PointerEvent) {
    e.preventDefault();
    drag = { x: e.clientX, w: previewW };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Suppress text selection on the page while dragging.
    document.body.style.userSelect = "none";
  }
  function onMove(e: PointerEvent) {
    if (drag) requested = drag.w + (e.clientX - drag.x);
  }
  // Used for both pointerup and pointercancel so the page-wide selection lock is always released.
  function onUp(e: PointerEvent) {
    drag = null;
    document.body.style.userSelect = "";
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  }
  // Restore the selection lock if we unmount mid-drag.
  $effect(() => () => {
    if (drag) document.body.style.userSelect = "";
  });
</script>

<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.8rem">
  {#if showSmall}
    <button type="button" class="dg-btn" data-active={active === "small" || undefined} onclick={() => (requested = 300)}>
      Small
    </button>
  {/if}
  {#if showMedium}
    <button type="button" class="dg-btn" data-active={active === "medium" || undefined} onclick={() => (requested = 420)}>
      Medium
    </button>
  {/if}
  <button type="button" class="dg-btn" data-active={active === "large" || undefined} onclick={() => (requested = Number.POSITIVE_INFINITY)}>
    Large
  </button>
</div>
<div {@attach avail.attach}>
  <div class="dg-resize" style={`width:${previewW}px`}>
    <HeadlessGrid
      layout={resp.layout}
      width={previewW}
      onLayoutChange={resp.onLayoutChange}
      options={{
        gridConfig: { cols: resp.cols, rowHeight: 48, margin: [10, 10], containerPadding: [10, 10] },
      }}
    >
      {#snippet content(it)}
        <DemoTile label={it.i.toUpperCase()} />
      {/snippet}
    </HeadlessGrid>
    <div
      class="dg-resize__handle"
      onpointerdown={onDown}
      onpointermove={onMove}
      onpointerup={onUp}
      onpointercancel={onUp}
      title="Drag to resize"
      aria-hidden="true"
    ></div>
  </div>
</div>
