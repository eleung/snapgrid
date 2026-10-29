/** @jsxImportSource solid-js */
import { useSortable } from "@dnd-kit/solid/sortable";

// A tray card — a plain dnd-kit sortable. It reorders live within the tray and, because it
// accepts grid tiles too, one can be dropped in. No isDragging opacity: dnd-kit clones the
// card for the float, so an opacity here would dim the preview. Mirrors React/Svelte/Vue
// `TrayCard`.
export function TrayCard(props: { id: string; index: number }) {
  // dnd-kit's Solid adapter reads its inputs inside an effect, so getters keep `id` and
  // `index` tracked as the tray reorders.
  const sortable = useSortable({
    get id() {
      return props.id;
    },
    get index() {
      return props.index;
    },
    group: "tray",
    type: "tray-card",
    accept: ["tray-card", "grid-item"],
  });

  return (
    <div
      ref={sortable.ref}
      class="dg-tray__card"
      data-dragging={sortable.isDragging() || undefined}
      style={{
        padding: "9px 11px",
        "margin-bottom": "7px",
        "border-radius": "8px",
        background: "var(--dg-card)",
        border: "1px solid var(--dg-line-strong)",
        "font-weight": 600,
        "font-size": "13px",
        cursor: "grab",
        "touch-action": "none",
      }}
    >
      {props.id}
    </div>
  );
}
