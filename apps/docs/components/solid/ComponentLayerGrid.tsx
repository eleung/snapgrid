/** @jsxImportSource solid-js */
import { GridLayout, useContainerWidth } from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { DemoTile } from "./DemoTile";
import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";

// The turnkey shell: <GridLayout> mints its own DragDropProvider (and runs the surface in
// a child component, so the hooks still see the manager) and renders the tiles, resize
// handles, and placeholder — no hooks, no dnd-kit wiring. The rest of the gallery is
// headless; this one demo shows the component layer. Item content comes from the
// render-prop child, which receives an accessor for the item's committed entry.
export default function ComponentLayerGrid() {
  const [layout, setLayout] = createSignal(BASIC.slice(0, 4));
  const { width, ref } = useContainerWidth({ initialWidth: STAGE_WIDTH });

  return (
    <div class="dg-cl" ref={ref}>
      <GridLayout
        layout={layout()}
        width={width()}
        gridConfig={GRID}
        resizeConfig={{ handles: ["se"] }}
        onLayoutChange={setLayout}
      >
        {(item) => <DemoTile label={item().i.toUpperCase()} meta={`${item().w}×${item().h}`} />}
      </GridLayout>
    </div>
  );
}
