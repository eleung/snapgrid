import { useCallback, useEffect, useLayoutEffect, useState } from "react";

// useLayoutEffect warns when run on the server; fall back to useEffect there so
// the hook is SSR-safe (Next.js / Remix). The initial `width` is `initialWidth`
// on both server and client, so the first render matches and there's no
// hydration mismatch — the measured width is applied right after mount.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface UseContainerWidthOptions {
  /** Width to use until the element has been measured. @default 1280 */
  initialWidth?: number;
}

export interface UseContainerWidthResult {
  /** Measured container width in pixels (or `initialWidth` before mount). */
  width: number;
  /** Whether the element has been measured at least once. */
  mounted: boolean;
  /** Attach to the element whose width should drive the grid. */
  containerRef: (element: HTMLElement | null) => void;
}

/**
 * Measure a container's width with a `ResizeObserver`. Replaces react-grid-layout's
 * `WidthProvider` HOC with a hook, mirroring RGL v2's `useContainerWidth`.
 */
export function useContainerWidth(options: UseContainerWidthOptions = {}): UseContainerWidthResult {
  const { initialWidth = 1280 } = options;
  const [width, setWidth] = useState(initialWidth);
  const [mounted, setMounted] = useState(false);
  // Track the element in state so the observer effect re-runs when it changes;
  // this is StrictMode-safe (the effect's cleanup disconnects the observer).
  const [element, setElement] = useState<HTMLElement | null>(null);
  const containerRef = useCallback((node: HTMLElement | null) => setElement(node), []);

  useIsomorphicLayoutEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const next = element.getBoundingClientRect().width;
      if (next > 0) {
        setWidth(next);
        setMounted(true);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { width, mounted, containerRef };
}
