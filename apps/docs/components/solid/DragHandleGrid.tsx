/** @jsxImportSource solid-js */
import { DragDropProvider, useContainerWidth } from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { HandleTile } from "./HandleTile";
import { HeadlessGridHost } from "./HeadlessGrid";
import { GRID, HANDLE, STAGE_WIDTH } from "./demo-config";

// Drag only by the grip; the rest of the tile stays interactive. Headless: every tile is
// a custom HandleTile (useGridItem + handleRef grip). `isResizable` is off so a corner
// never starts a resize on these bar-headed tiles. containerWidth is measured outside the
// provider and fed in (it reads no context, so it may live in the same component); the
// grid host renders INSIDE the provider. Mirrors the React/Svelte/Vue drag-handle demo.
export default function DragHandleGrid() {
  const [layout, setLayout] = createSignal(HANDLE);
  const { width, ref } = useContainerWidth({ initialWidth: STAGE_WIDTH });

  return (
    <div ref={ref}>
      <DragDropProvider>
        <HeadlessGridHost
          layout={layout()}
          width={width()}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID, isResizable: false }}
          isCustom={() => true}
          tile={(item, group) => <HandleTile id={item().i} group={group} />}
        />
      </DragDropProvider>
    </div>
  );
}
