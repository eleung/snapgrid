/** @jsxImportSource solid-js */
import { gravityCompactor, masonryCompactor, shelfCompactor } from "@snapgridjs/extras";
import {
  type Compactor,
  horizontalCompactor,
  noCompactor,
  useContainerWidth,
  verticalCompactor,
} from "@snapgridjs/solid";
import { For, createSignal } from "solid-js";
import { HeadlessGrid } from "./HeadlessGrid";
import { GRID, PACK, STAGE_WIDTH } from "./demo-config";

// Swap the packing algorithm at runtime. vertical/horizontal come from the core;
// masonry/gravity/shelf from @snapgridjs/extras; "none" leaves tiles where dropped.
const PACKERS: Record<string, Compactor> = {
  vertical: verticalCompactor,
  horizontal: horizontalCompactor,
  masonry: masonryCompactor,
  gravity: gravityCompactor,
  shelf: shelfCompactor,
  none: noCompactor,
};

export default function CompactorGrid() {
  const [packer, setPacker] = createSignal("vertical");
  const [layout, setLayout] = createSignal(PACK);
  const { width, ref } = useContainerWidth({ initialWidth: STAGE_WIDTH });

  const selectPacker = (name: string) => {
    setPacker(name);
    setLayout((current) => PACKERS[name]?.compact(current, GRID.cols) ?? current);
  };

  return (
    <>
      <div
        style={{ display: "flex", "flex-wrap": "wrap", gap: "0.4rem", "margin-bottom": "0.8rem" }}
      >
        <For each={Object.keys(PACKERS)}>
          {(name) => (
            <button
              type="button"
              class="dg-btn"
              data-active={packer() === name || undefined}
              onClick={() => selectPacker(name)}
            >
              {name}
            </button>
          )}
        </For>
      </div>
      <div ref={ref}>
        <HeadlessGrid
          layout={layout()}
          width={width()}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID, compactor: PACKERS[packer()] ?? verticalCompactor }}
        />
      </div>
    </>
  );
}
