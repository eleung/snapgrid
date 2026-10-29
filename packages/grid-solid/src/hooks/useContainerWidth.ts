import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

export interface UseContainerWidthOptions {
  /** Width to use until the element has been measured. @default 1280 */
  initialWidth?: number;
}

export interface ContainerWidthHandle {
  /** Measured container width in pixels (or `initialWidth` before mount). */
  width: Accessor<number>;
  /** Whether the element has been measured at least once. */
  mounted: Accessor<boolean>;
  /** Ref callback for the element whose width drives the grid. */
  ref: (el: HTMLElement) => void;
}

/**
 * Measure a container's width with a `ResizeObserver`, exposed as accessors. Replaces
 * react-grid-layout's `WidthProvider` HOC, mirroring RGL v2's `useContainerWidth`.
 * SSR-safe: measurement only runs in an effect (never on the server), so server render
 * uses `initialWidth` and the measured width applies right after mount.
 */
export function useContainerWidth(options: UseContainerWidthOptions = {}): ContainerWidthHandle {
  const { initialWidth = 1280 } = options;
  const [width, setWidth] = createSignal(initialWidth);
  const [mounted, setMounted] = createSignal(false);
  const [element, setElement] = createSignal<HTMLElement>();

  // Solid calls the ref when the element is CREATED, before it is attached, so measuring
  // there would read 0. Observe from an effect instead, which runs once it is in the DOM.
  createEffect(() => {
    const node = element();
    if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const next = node.getBoundingClientRect().width;
      if (next > 0) {
        setWidth(next);
        setMounted(true);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    onCleanup(() => observer.disconnect());
  });

  return { width, mounted, ref: setElement };
}
