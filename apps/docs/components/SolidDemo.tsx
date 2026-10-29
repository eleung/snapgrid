"use client";

import { type ReactElement, useEffect, useRef } from "react";
import type { Component } from "solid-js";

/** A demo module's loader: `() => import("./solid/BasicGrid")`. Keep it module-level. */
export type SolidDemoLoader = () => Promise<{ default: Component<Record<string, unknown>> }>;

interface SolidDemoProps {
  /**
   * Loads the compiled Solid component (babel-preset-solid, see next.config.mjs). A loader
   * rather than a component because Solid's compiled DOM output runs browser-only code at
   * module load (`template()`, `delegateEvents()`), so a demo module must never be
   * evaluated during the static prerender — only here, after hydration.
   */
  load: SolidDemoLoader;
  /** Props passed to the Solid component. */
  props?: Record<string, unknown>;
  className?: string;
}

/**
 * Mounts a Solid component as a client-side island inside the React docs: loads it after
 * hydration, renders it into a host div, and disposes the Solid root on unmount, so the
 * static export prerenders an empty host and the demo comes alive in the browser.
 * Mirrors <SvelteDemo> / <VueDemo>.
 */
export function SolidDemo({ load, props, className }: SolidDemoProps): ReactElement {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    // Strict mode (and fast unmounts) can tear the island down before the import resolves.
    let cancelled = false;
    void Promise.all([load(), import("solid-js/web")]).then(([mod, web]) => {
      const target = host.current;
      if (cancelled || !target) return;
      dispose = web.render(() => web.createComponent(mod.default, props ?? {}), target);
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [load, props]);

  return <div ref={host} className={className} />;
}
