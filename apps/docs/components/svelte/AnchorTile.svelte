<script lang="ts">
  import { createGridItem } from "@snapgridjs/svelte";

  // The lock ⟷ pin toggle tile: static (others flow around it); PINNED adds
  // `isDraggable` so it can be dragged by the grip. The grip is ALWAYS the drag
  // handle (attachHandle) so dnd-kit puts its role + aria-disabled on the grip, not
  // the cell — keeping the toggle a clean, clickable sibling. Icons are lucide paths
  // inlined (no icon dep). Mirrors the React `AnchorTile`.
  let {
    id,
    group,
    pinned,
    onTogglePin,
  }: { id: string; group: string; pinned: boolean; onTogglePin: () => void } = $props();

  // svelte-ignore state_referenced_locally
  const tile = createGridItem({ id, group });
</script>

<div {@attach tile.attach} style={tile.style} class="dg-cell">
  <div class="dg-tile dg-tile--static dg-anchor" class:dg-anchor--pinned={pinned}>
    <div class="dg-anchor__head">
      <span
        class="dg-anchor__grip"
        {@attach tile.attachHandle}
        title={pinned ? "Drag to move" : undefined}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" />
        </svg>
      </span>
      <span class="dg-tile__label">{pinned ? "PINNED" : "LOCKED"}</span>
      <button
        type="button"
        class="dg-anchor__toggle"
        aria-pressed={pinned}
        title={pinned ? "Pinned (draggable) — click to lock" : "Locked — click to pin"}
        onclick={onTogglePin}
      >
        {#if pinned}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 17v5" />
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
          </svg>
        {:else}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        {/if}
      </button>
    </div>
    <span class="dg-tile__meta">{pinned ? "anchored · draggable" : "anchored · locked"}</span>
  </div>
</div>
