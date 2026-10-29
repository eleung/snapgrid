/** @jsxImportSource solid-js */
import { type Layout, useContainerWidth } from "@snapgridjs/solid";
import { For } from "solid-js";
import { HeadlessGridHost } from "./HeadlessGrid";
import { TrayCard } from "./TrayCard";
import { INTEROP_GAP, INTEROP_GRID, INTEROP_TRAY_W, STAGE_WIDTH } from "./demo-config";

// Rendered inside the provider so useGridContainer resolves the shared manager. Measures
// the grid's OWN flex slot (beside the fixed-width tray) so its width feeds the grid
// directly — no measuring the whole row and subtracting the tray. Mirrors React/Svelte/Vue
// `SortableGridBody`.
export function SortableGridBody(props: {
  grid: Layout;
  onGridChange: (layout: Layout) => void;
  tray: string[];
}) {
  const { width, ref } = useContainerWidth({
    initialWidth: STAGE_WIDTH - INTEROP_TRAY_W - INTEROP_GAP,
  });

  const options = {
    gridConfig: INTEROP_GRID,
    isResizable: false,
    // Let the grid receive the tray's sortable cards (the receive itself is snapMove).
    accept: (source: { type?: unknown }) => source.type === "tray-card",
  };

  return (
    <div
      class="dg-interop"
      style={{ display: "flex", gap: `${INTEROP_GAP}px`, "align-items": "flex-start" }}
    >
      <div
        class="dg-tray"
        style={{
          width: `${INTEROP_TRAY_W}px`,
          flex: "0 0 auto",
          display: "flex",
          "flex-direction": "column",
        }}
      >
        <span
          style={{
            "font-size": "11px",
            "font-weight": 600,
            color: "var(--dg-muted)",
            "margin-bottom": "6px",
          }}
        >
          Widgets
        </span>
        <For each={props.tray}>{(id, i) => <TrayCard id={id} index={i()} />}</For>
      </div>
      {/* Measure this flex slot; the grid surface fills it. */}
      <div style={{ flex: "1 1 auto", "min-width": 0 }} ref={ref}>
        <HeadlessGridHost
          layout={props.grid}
          width={width()}
          onLayoutChange={props.onGridChange}
          options={options}
          content={(item) => <div class="dg-nest__tile">{item().i}</div>}
        />
      </div>
    </div>
  );
}
