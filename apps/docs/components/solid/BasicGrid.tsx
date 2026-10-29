/** @jsxImportSource solid-js */
import { useContainerWidth } from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { HeadlessGrid } from "./HeadlessGrid";
import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";

// A real @snapgridjs/solid grid: drag a tile, resize from the SE corner, watch the rest
// compact upward. Headless composition (useGridContainer + useGridItem), mirroring the
// React/Svelte/Vue basic demo — the layout math + drag engine are the shared,
// framework-free core.
export default function BasicGrid() {
  const [layout, setLayout] = createSignal(BASIC);
  const { width, ref } = useContainerWidth({ initialWidth: STAGE_WIDTH });

  const options = { gridConfig: GRID, resizeConfig: { handles: ["se" as const] } };

  return (
    <div ref={ref}>
      <HeadlessGrid
        layout={layout()}
        width={width()}
        onLayoutChange={setLayout}
        options={options}
        resizable
      />
    </div>
  );
}
