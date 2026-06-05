# @snapgridjs/dnd

## 0.5.0

### Minor Changes

- afa1b91: Extract the framework-agnostic dnd-kit engine into a new package, **`@snapgridjs/dnd`**.

  The drag/resize/cross-grid orchestration — previously spread across each grid's
  React controller (one dnd-kit monitor per grid) — is now a single per-manager
  engine with no React dependency, living in `@snapgridjs/dnd` alongside the
  observable `GridController` bridge, the registry, collision detector, snap-to-grid
  modifier, and sensors. `@snapgridjs/react` is now a thin binding over it.

  For React consumers this is a transparent internal change: the `@snapgridjs/react`
  public API is unchanged (the drag/drop config and event types are still exported
  from it, now re-exported from the engine package). The new package exists so
  Vue/Solid/Svelte bindings can share one engine, and exposes a binding-author
  surface (`attachEngine`, `GridController`, `registerController`/`getController`,
  and the dnd-kit interaction helpers).

  Internally, one engine now drives every grid on a manager (instead of N monitors),
  so multi-grid pages process each drag event once rather than per grid.

### Patch Changes

- @snapgridjs/core@0.5.0
