/** @jsxImportSource solid-js */
import { useContainerWidth } from "@snapgridjs/solid";
import { createMemo, createSignal } from "solid-js";
import { AnchorTile } from "./AnchorTile";
import { HeadlessGrid } from "./HeadlessGrid";
import { GRID, STAGE_WIDTH, STATIC } from "./demo-config";

// Toggle the "anchor" tile between LOCKED (static, can't move) and PINNED (static but
// still draggable by its grip). Either way, the others flow around it. `view` re-derives
// the anchor's isDraggable from `pinned`; drags commit to `layout`.
export default function StaticItemGrid() {
  const [pinned, setPinned] = createSignal(false);
  const [layout, setLayout] = createSignal(STATIC);
  const view = createMemo(() =>
    layout().map((it) => (it.i === "anchor" ? { ...it, isDraggable: pinned() } : it)),
  );
  const { width, ref } = useContainerWidth({ initialWidth: STAGE_WIDTH });

  return (
    <div ref={ref}>
      <HeadlessGrid
        layout={view()}
        width={width()}
        onLayoutChange={setLayout}
        options={{ gridConfig: GRID }}
        isCustom={(it) => it.i === "anchor"}
        tile={(item, group) => (
          <AnchorTile
            id={item().i}
            group={group}
            pinned={pinned()}
            onTogglePin={() => setPinned((p) => !p)}
          />
        )}
      />
    </div>
  );
}
