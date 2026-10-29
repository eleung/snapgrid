/** @jsxImportSource solid-js */
import {
  SNAPGRID_DROPPABLE_ATTR,
  nestedDropCollisionDetector,
  useDroppable,
} from "@snapgridjs/solid";
import { For, Show } from "solid-js";
import { ARCHIVE_ZONE_ID } from "./demo-config";

// The nested drop zone: a plain useDroppable that outranks the grid it sits in. The
// collision detector is what makes it win; the marker attribute is only for droppables
// you'd nest INSIDE it (harmless here). Mirrors the React/Svelte/Vue `ArchiveZone`.
export function ArchiveZone(props: { archived: string[]; onRestore: (id: string) => void }) {
  const droppable = useDroppable({
    id: ARCHIVE_ZONE_ID,
    accept: (source) => source.type === "grid-item",
    collisionDetector: nestedDropCollisionDetector,
  });

  const hint = () => {
    if (droppable.isDropTarget()) return "release to archive";
    return props.archived.length ? "click a tile to restore" : "drag a tile here";
  };

  return (
    <div
      ref={droppable.ref}
      {...{ [SNAPGRID_DROPPABLE_ATTR]: "" }}
      style={{
        height: "100%",
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        gap: "8px",
        "text-align": "center",
        "border-radius": "10px",
        border: `2px dashed ${droppable.isDropTarget() ? "var(--dg-accent)" : "var(--dg-line-strong)"}`,
        background: droppable.isDropTarget() ? "var(--dg-accent-soft)" : "transparent",
        color: droppable.isDropTarget() ? "var(--dg-accent)" : "var(--dg-muted)",
        transition: "background 120ms, border-color 120ms, color 120ms",
      }}
    >
      <span style={{ "font-weight": 600 }}>Archive</span>
      <span style={{ "font-size": "12px" }}>{hint()}</span>
      <Show when={props.archived.length}>
        <div
          style={{ display: "flex", "flex-wrap": "wrap", gap: "6px", "justify-content": "center" }}
        >
          <For each={props.archived}>
            {(tileId) => (
              <button
                type="button"
                style={{
                  font: "inherit",
                  "font-size": "11px",
                  "font-weight": 600,
                  padding: "3px 9px",
                  "border-radius": "999px",
                  cursor: "pointer",
                  color: "var(--dg-accent)",
                  background: "var(--dg-accent-soft)",
                  border: "1px solid var(--dg-accent)",
                }}
                onClick={() => props.onRestore(tileId)}
              >
                {tileId.toUpperCase()}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
