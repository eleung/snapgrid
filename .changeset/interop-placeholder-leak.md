---
"@snapgridjs/dnd": patch
---

Fix: a grid's landing placeholder could linger after a tile was dragged out to a foreign dnd-kit sortable

When a grid tile is handed off to a `useSortable` list mid-drag, its dragged element is swapped for the
foreign card, so the engine stops seeing a snapgrid payload and takes its external-source path. That
path skipped hiding the source grid's placeholder, so the "where it'll land" marker could stay rendered
in the grid while the drag was over the sortable (a dragover/dragmove race, so it surfaced
intermittently). The source grid's placeholder is now cleared on that path too.
