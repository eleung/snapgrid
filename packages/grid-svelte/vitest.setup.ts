import { cleanup } from "@testing-library/svelte";
import { afterEach } from "vitest";

// Unmount rendered trees between tests (globals are not enabled).
afterEach(cleanup);

// jsdom lacks ResizeObserver; provide a minimal stub for createContainerWidth.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}
