import { type Ref, shallowRef, watch } from "vue";
import { type RefTarget, toElement } from "../element.js";

export interface UseContainerWidthOptions {
  /** Width to use until the element has been measured. @default 1280 */
  initialWidth?: number;
}

export interface ContainerWidthHandle {
  /** Measured container width in pixels (or `initialWidth` before mount). */
  width: Ref<number>;
  /** Whether the element has been measured at least once. */
  mounted: Ref<boolean>;
  /** Function ref for the element whose width drives the grid. */
  setRef: (el: RefTarget) => void;
}

/**
 * Measure a container's width with a `ResizeObserver`, exposed as reactive refs.
 * Replaces react-grid-layout's `WidthProvider` HOC, mirroring RGL v2's
 * `useContainerWidth`. SSR-safe: measurement only runs once the element is bound on the
 * client, so server render uses `initialWidth` and the measured width applies right
 * after mount.
 */
export function useContainerWidth(options: UseContainerWidthOptions = {}): ContainerWidthHandle {
  const { initialWidth = 1280 } = options;
  const width = shallowRef(initialWidth);
  const mounted = shallowRef(false);
  const elRef = shallowRef<HTMLElement | null>(null);

  // Vue invokes a function ref on EVERY patch, not just when the element changes, so
  // this must stay a pure assignment. Writing the same node to a shallowRef doesn't
  // trigger, which is what keys the observer effect below to element identity — the
  // equivalent of React's `[element]` dep and Svelte's attachment lifecycle. Doing the
  // observe/disconnect here instead would rebuild the ResizeObserver and force a
  // synchronous layout on every render.
  const setRef = (el: RefTarget): void => {
    elRef.value = toElement(el);
  };

  watch(
    elRef,
    (node, _prev, onCleanup) => {
      if (!node || typeof ResizeObserver === "undefined") return;
      const measure = () => {
        const next = node.getBoundingClientRect().width;
        if (next > 0) {
          width.value = next;
          mounted.value = true;
        }
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      onCleanup(() => observer.disconnect());
    },
    { flush: "post" },
  );

  return { width, mounted, setRef };
}
