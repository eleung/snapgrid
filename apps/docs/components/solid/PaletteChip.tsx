/** @jsxImportSource solid-js */
import { Feedback, useDraggable } from "@snapgridjs/solid";

// A plain dnd-kit draggable carrying a `snapGridDrop` size payload; a grid with dropConfig
// enabled synthesizes an item of this size when it's dropped in. The `clone` feedback
// leaves the chip in place and drags a copy. Shared `.dg-chip` look. Mirrors the React /
// Svelte / Vue `PaletteChip`. Imported from @snapgridjs/solid (not @dnd-kit/solid) so it
// shares snapgrid's single dnd-kit instance.
export function PaletteChip(props: { id: string; label: string; w: number; h: number }) {
  const draggable = useDraggable({
    id: props.id,
    data: { snapGridDrop: { w: props.w, h: props.h } },
    plugins: [Feedback.configure({ feedback: "clone" })],
  });

  return (
    <div ref={draggable.ref} class="dg-chip">
      {props.label}
      <small>
        {props.w}×{props.h}
      </small>
    </div>
  );
}
