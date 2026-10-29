/** @jsxImportSource solid-js */
import { useContainerWidth, useResponsiveLayout } from "@snapgridjs/solid";
import { Show, createMemo, createSignal, onCleanup } from "solid-js";
import { DemoTile } from "./DemoTile";
import { HeadlessGrid } from "./HeadlessGrid";
import { RESP, RESP_BREAKPOINTS, RESP_COLS, RESP_MIN, STAGE_WIDTH } from "./demo-config";

// Columns + layout switch by breakpoint as the preview width changes. Drag the right
// edge to resize the preview (or use the presets). Headless responsive: resolve the
// active breakpoint's columns + layout from the preview width (the same engine the
// turnkey ResponsiveGridLayout uses), then feed them into the shared HeadlessGrid —
// like every other demo. Mirrors the React/Svelte/Vue responsive demo.
export default function ResponsiveGrid() {
  const avail = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [layouts, setLayouts] = createSignal(RESP);
  // Infinity = "as wide as the stage allows" (clamped to `max`), so the demo opens
  // truly Large. Dragging or Small/Medium replaces it with a concrete width.
  const [requested, setRequested] = createSignal(Number.POSITIVE_INFINITY);
  let drag: { x: number; w: number } | null = null;

  const max = createMemo(() => Math.max(RESP_MIN, Math.round(avail.width())));
  const previewW = createMemo(() => Math.min(Math.max(requested(), RESP_MIN), max()));

  // Options are a GETTER so the engine tracks the live preview width + layouts.
  const responsive = useResponsiveLayout(() => ({
    width: previewW(),
    layouts: layouts(),
    breakpoints: RESP_BREAKPOINTS,
    cols: RESP_COLS,
    onLayoutChange: (_active, all) => setLayouts(all),
  }));

  // A preset is hidden when its target width can't fit the stage (it would clamp to full
  // and duplicate Large). The active preset is derived so the buckets stay mutually
  // exclusive: Large is the catch-all and wins at full width.
  const showSmall = () => max() >= 300;
  const showMedium = () => max() >= 420;
  const active = () => {
    const atFull = previewW() >= max();
    if (!atFull && showSmall() && previewW() < 360) return "small";
    if (!atFull && showMedium() && previewW() < 480) return "medium";
    return "large";
  };

  const onDown = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    e.preventDefault();
    drag = { x: e.clientX, w: previewW() };
    e.currentTarget.setPointerCapture(e.pointerId);
    // Suppress text selection on the page while dragging.
    document.body.style.userSelect = "none";
  };
  const onMove = (e: PointerEvent) => {
    if (drag) setRequested(drag.w + (e.clientX - drag.x));
  };
  // Used for both pointerup and pointercancel so the page-wide selection lock is always
  // released.
  const onUp = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    drag = null;
    document.body.style.userSelect = "";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  // Restore the selection lock if we unmount mid-drag.
  onCleanup(() => {
    if (drag) document.body.style.userSelect = "";
  });

  return (
    <>
      <div
        style={{ display: "flex", "flex-wrap": "wrap", gap: "0.4rem", "margin-bottom": "0.8rem" }}
      >
        <Show when={showSmall()}>
          <button
            type="button"
            class="dg-btn"
            data-active={active() === "small" || undefined}
            onClick={() => setRequested(300)}
          >
            Small
          </button>
        </Show>
        <Show when={showMedium()}>
          <button
            type="button"
            class="dg-btn"
            data-active={active() === "medium" || undefined}
            onClick={() => setRequested(420)}
          >
            Medium
          </button>
        </Show>
        <button
          type="button"
          class="dg-btn"
          data-active={active() === "large" || undefined}
          onClick={() => setRequested(Number.POSITIVE_INFINITY)}
        >
          Large
        </button>
      </div>
      <div ref={avail.ref}>
        <div class="dg-resize" style={{ width: `${previewW()}px` }}>
          <HeadlessGrid
            layout={responsive.layout()}
            width={previewW()}
            onLayoutChange={responsive.onLayoutChange}
            options={{
              gridConfig: {
                cols: responsive.cols(),
                rowHeight: 48,
                margin: [10, 10],
                containerPadding: [10, 10],
              },
            }}
            content={(item) => <DemoTile label={item().i.toUpperCase()} />}
          />
          <div
            class="dg-resize__handle"
            title="Drag to resize"
            aria-hidden="true"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </div>
      </div>
    </>
  );
}
