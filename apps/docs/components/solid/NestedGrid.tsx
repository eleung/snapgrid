/** @jsxImportSource solid-js */
import { useContainerWidth } from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { DemoTile } from "./DemoTile";
import { HeadlessGrid } from "./HeadlessGrid";
import { NestedPanelTile } from "./NestedPanelTile";
import { GRID, NESTED_INNER, NESTED_OUTER, STAGE_WIDTH } from "./demo-config";

// A grid inside another grid's tile — they share one provider (a nested grid detects the
// ancestor and doesn't mint a second manager), so a tile can be dragged between the inner
// and outer grids. The panel renders as a custom tile so its header is the drag handle;
// the other outer tiles fall back to the default tile.
export default function NestedGrid() {
  const [outer, setOuter] = createSignal(NESTED_OUTER);
  const [inner, setInner] = createSignal(NESTED_INNER);
  const { width, ref } = useContainerWidth({ initialWidth: STAGE_WIDTH });

  return (
    <div ref={ref}>
      <HeadlessGrid
        layout={outer()}
        width={width()}
        onLayoutChange={setOuter}
        options={{ gridConfig: GRID, isResizable: false }}
        isCustom={(it) => it.i === "panel"}
        tile={(item, group) => (
          <NestedPanelTile id={item().i} group={group} inner={inner()} onInnerChange={setInner} />
        )}
        content={(item) => <DemoTile label={item().i.toUpperCase()} accent={item().i === "b"} />}
      />
    </div>
  );
}
