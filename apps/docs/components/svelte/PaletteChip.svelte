<script lang="ts">
  import { Feedback, createDraggable } from "@snapgridjs/svelte";

  // A plain dnd-kit draggable carrying a `snapGridDrop` size payload; a grid with
  // dropConfig enabled synthesizes an item of this size when it's dropped in. The
  // `clone` feedback leaves the chip in place and drags a copy. Shared `.dg-chip`
  // look. Mirrors the React `PaletteChip`.
  let { id, label, w, h }: { id: string; label: string; w: number; h: number } = $props();

  // svelte-ignore state_referenced_locally
  const drag = createDraggable({
    id,
    data: { snapGridDrop: { w, h } },
    plugins: [Feedback.configure({ feedback: "clone" })],
  });
</script>

<div {@attach drag.attach} class="dg-chip">
  {label}
  <small>{w}×{h}</small>
</div>
