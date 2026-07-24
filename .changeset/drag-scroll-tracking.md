---
"@snapgridjs/dnd": patch
---

Fix drag position tracking when the page scrolls mid-drag. An in-grid drag (and
resize) derived its target cell from the pointer against the grid's position
captured at drag start, so once the page scrolled — including dnd-kit's auto-scroll
near a viewport edge — the target stopped following and a tile couldn't reach or drop
at rows the scroll revealed. The engine now re-anchors to the grid's live position
each frame and recomputes on scroll (dnd-kit emits no drag-move event while
scrolling), matching the cross-grid receive path that already read a live rect.
