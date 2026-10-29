/** @jsxImportSource solid-js */
import { useContainerWidth } from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { DemoTile } from "./DemoTile";
import { HeadlessGrid } from "./HeadlessGrid";
import { GRID, RESIZE, STAGE_WIDTH } from "./demo-config";

// Per-item resize constraints: drag any corner; minW/maxW/minH/maxH are enforced.
// The tile labels double as their constraint ("min 2×1", "max 6×3", "free").
export default function ResizeGrid() {
  const [layout, setLayout] = createSignal(RESIZE);
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
        content={(item) => <DemoTile label={item().i} meta={`${item().w}×${item().h}`} />}
      />
    </div>
  );
}
