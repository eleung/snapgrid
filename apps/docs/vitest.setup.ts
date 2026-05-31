// Importing the showcase data pulls in @snapgridjs/react → @dnd-kit/dom, which
// references ResizeObserver at module load. jsdom lacks it; provide a stub.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}
