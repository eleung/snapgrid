---
"@snapgridjs/dnd": minor
"@snapgridjs/react": minor
"@snapgridjs/svelte": minor
"@snapgridjs/vue": minor
---

Requires dnd-kit 0.5. The `@dnd-kit/*` peer dependencies move from `^0.4.0` to `^0.5.0`; upgrade
your `@dnd-kit/*` packages alongside snapgrid. No snapgrid API changes. dnd-kit 0.5 brings keyboard
shortcuts that respect keyboard layouts, smoother drag starts, and less style recalculation at the
start and end of drags on large pages.
