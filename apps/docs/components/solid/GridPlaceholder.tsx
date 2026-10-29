/** @jsxImportSource solid-js */
import { useGridPlaceholder } from "@snapgridjs/solid";
import { Show } from "solid-js";

// The landing-cell marker shown while a tile is dragged — useGridPlaceholder returns an
// accessor for its position (or null when idle). Headless grids render their own.
// Mirrors the React `Placeholder` helper (demos.tsx) and the Svelte/Vue `GridPlaceholder`.
export function GridPlaceholder(props: { group: string }) {
  const placeholder = useGridPlaceholder(props.group);
  return (
    <Show when={placeholder()}>
      {(current) => (
        <div
          class="dg-placeholder"
          style={{
            ...current().style,
            border: "1px dashed var(--dg-accent)",
            "border-radius": "9px",
            background: "var(--dg-accent-soft)",
            transition: "transform 150ms ease, width 150ms ease, height 150ms ease",
          }}
        />
      )}
    </Show>
  );
}
