// jsdom lacks ResizeObserver, which @dnd-kit/dom references at import time
// (ResizeNotifier). Provide a minimal stub so the engine modules can be imported
// under the test environment.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}
