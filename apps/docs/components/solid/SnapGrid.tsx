/** @jsxImportSource solid-js */
import { useContainerWidth } from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { HeadlessGrid } from "./HeadlessGrid";
import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";

// Toggle whether the dragged tile glides freely with the pointer or snaps to whole
// cells (dragConfig.snapToGrid).
export default function SnapGrid() {
  const [snap, setSnap] = createSignal(false);
  const [layout, setLayout] = createSignal(BASIC.slice(0, 4));
  const { width, ref } = useContainerWidth({ initialWidth: STAGE_WIDTH });

  return (
    <>
      <div
        style={{ display: "flex", "flex-wrap": "wrap", gap: "0.4rem", "margin-bottom": "0.8rem" }}
      >
        <button
          type="button"
          class="dg-btn"
          data-active={!snap() || undefined}
          onClick={() => setSnap(false)}
        >
          glide (default)
        </button>
        <button
          type="button"
          class="dg-btn"
          data-active={snap() || undefined}
          onClick={() => setSnap(true)}
        >
          snapToGrid
        </button>
      </div>
      <div ref={ref}>
        <HeadlessGrid
          layout={layout()}
          width={width()}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID, dragConfig: { snapToGrid: snap() } }}
        />
      </div>
    </>
  );
}
