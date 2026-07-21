<script lang="ts">
  import { createSortable } from "@dnd-kit/svelte/sortable";

  // A tray card — a plain dnd-kit sortable. It reorders live within the tray and, because
  // it accepts grid tiles too, one can be dropped in. No isDragging opacity: dnd-kit clones
  // the card for the float, so an opacity here would dim the preview. Mirrors React `TrayCard`.
  let { id, index }: { id: string; index: number } = $props();

  const sortable = createSortable({
    get id() {
      return id;
    },
    get index() {
      return index;
    },
    group: "tray",
    type: "tray-card",
    accept: ["tray-card", "grid-item"],
  });
</script>

<div
  {@attach sortable.attach}
  class="dg-tray__card"
  data-dragging={sortable.isDragging || undefined}
  style="padding:9px 11px;margin-bottom:7px;border-radius:8px;background:var(--dg-card);border:1px solid var(--dg-line-strong);font-weight:600;font-size:13px;cursor:grab;touch-action:none;"
>
  {id}
</div>
