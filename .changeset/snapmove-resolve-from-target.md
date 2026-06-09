---
"@snapgridjs/dnd": minor
"@snapgridjs/react": minor
---

`snapMove` resolves the destination grid from `event.operation.target` and reads its geometry, compactor, and default item size from the grid the pointer is over — interop `onDragOver` handlers no longer rebuild `PositionParams` by hand. Every `SnapMoveContext` field is an optional override, and a foreign source's `snapGridDrop` spec (size + id) is honored, matching the managed external-drop path.
