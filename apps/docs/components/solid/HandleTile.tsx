/** @jsxImportSource solid-js */
import { useGridItem } from "@snapgridjs/solid";
import { createSignal } from "solid-js";

// The grip carries `handleRef` — only a pointer-down there starts a drag, so the Like
// button stays clickable. No `dragConfig.handle` selector needed. Mirrors the React
// `DragHandleTile` / Svelte + Vue `HandleTile`: `.dg-tile--barred` with a full-bleed grip
// header over a still-clickable Like button. The Heart is lucide's path inlined (no icon
// dep).
export function HandleTile(props: { id: string; group: string }) {
  const tile = useGridItem({ id: props.id, group: props.group });
  const [likes, setLikes] = createSignal(0);

  return (
    <div
      ref={tile.ref}
      style={tile.style()}
      class="dg-cell"
      data-dragging={tile.isDragging() || undefined}
    >
      <div class="dg-tile dg-tile--barred" style={{ width: "100%", height: "100%" }}>
        <span ref={tile.handleRef} class="dg-grip dg-grip--bar" aria-label="Drag handle">
          ⠿ {props.id.toUpperCase()}
        </span>
        <button
          type="button"
          class="dg-likebtn"
          data-liked={likes() > 0 || undefined}
          onClick={() => setLikes((n) => n + 1)}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill={likes() > 0 ? "currentColor" : "none"}
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          {likes() > 0 ? likes() : "Like"}
        </button>
      </div>
    </div>
  );
}
