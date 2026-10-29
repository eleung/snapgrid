/** @jsxImportSource solid-js */
import { type Layout, SnapGridGroup } from "@snapgridjs/solid";
import { For, createSignal } from "solid-js";
import { DropTargetGrid } from "./DropTargetGrid";
import { PaletteChip } from "./PaletteChip";
import { PALETTE } from "./demo-config";

// A palette of draggable chips beside a drop-enabled grid, under one shared provider
// (SnapGridGroup) so a chip can be dropped into the grid — which synthesizes a new item of
// the chip's size. Mirrors the React/Svelte/Vue external-drop demo.
export default function ExternalDropGrid() {
  const [layout, setLayout] = createSignal<Layout>([{ i: "seed", x: 0, y: 0, w: 3, h: 2 }]);

  return (
    <SnapGridGroup>
      <div class="dg-gridrow">
        <div class="dg-subgrid dg-subgrid--auto">
          <span class="dg-subgrid__label">Palette</span>
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
            <For each={PALETTE}>
              {(c) => <PaletteChip id={c.id} label={c.label} w={c.w} h={c.h} />}
            </For>
          </div>
        </div>
        <DropTargetGrid layout={layout()} onLayoutChange={setLayout} />
      </div>
    </SnapGridGroup>
  );
}
