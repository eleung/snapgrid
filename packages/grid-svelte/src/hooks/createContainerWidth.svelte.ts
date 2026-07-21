export interface UseContainerWidthOptions {
  /** Width to use until the element has been measured. @default 1280 */
  initialWidth?: number;
}

export interface ContainerWidthHandle {
  /** Measured container width in pixels (or `initialWidth` before mount). */
  readonly width: number;
  /** Whether the element has been measured at least once. */
  readonly mounted: boolean;
  /** Svelte attachment for the element whose width drives the grid. */
  attach: (node: HTMLElement) => () => void;
}

/**
 * Measure a container's width with a `ResizeObserver`, exposed as reactive runes.
 * Replaces react-grid-layout's `WidthProvider` HOC, mirroring RGL v2's
 * `useContainerWidth`. SSR-safe: the attachment only runs on the client, so server
 * render uses `initialWidth` and the measured width applies right after mount.
 *
 * Must be called during component initialization.
 */
export function createContainerWidth(options: UseContainerWidthOptions = {}): ContainerWidthHandle {
  const { initialWidth = 1280 } = options;
  let width = $state(initialWidth);
  let mounted = $state(false);

  const attach = (node: HTMLElement): (() => void) => {
    if (typeof ResizeObserver === "undefined") return () => {};
    const measure = () => {
      const next = node.getBoundingClientRect().width;
      if (next > 0) {
        width = next;
        mounted = true;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  };

  return {
    get width() {
      return width;
    },
    get mounted() {
      return mounted;
    },
    attach,
  };
}
