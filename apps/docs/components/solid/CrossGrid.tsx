/** @jsxImportSource solid-js */
import { SnapGridGroup } from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { CrossSubGrid } from "./CrossSubGrid";
import { LEFT, RIGHT } from "./demo-config";

// Two grids under one <SnapGridGroup> (which supplies the shared DragDropProvider): drag
// tiles between them. The dragged tile floats itself across both grids. The sub-grids are
// children of the group, so they render inside the provider and resolve its manager.
export default function CrossGrid() {
  const [left, setLeft] = createSignal(LEFT);
  const [right, setRight] = createSignal(RIGHT);

  return (
    <SnapGridGroup>
      <div class="dg-gridrow">
        <CrossSubGrid label="Grid A" layout={left()} onLayoutChange={setLeft} />
        <CrossSubGrid label="Grid B" layout={right()} onLayoutChange={setRight} />
      </div>
    </SnapGridGroup>
  );
}
