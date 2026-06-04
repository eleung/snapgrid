---
"@snapgridjs/react": minor
"@snapgridjs/extras": minor
---

Support **pinned** tiles. A `static` item that also sets `isDraggable: true` is now immovable by compaction — other tiles flow around it — yet can still be picked up and dragged by the user (previously any `static` item was fully locked). The `@snapgridjs/extras` packers (`gravity`/`masonry`/`shelf`) now honor `static` placement too, matching the built-in compactors.
