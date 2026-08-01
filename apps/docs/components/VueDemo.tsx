"use client";

import { type ReactElement, useEffect, useRef } from "react";
import { type Component, createApp } from "vue";

interface VueDemoProps {
  /** A compiled Vue component (default import from a `.vue` file). */
  component: Component;
  /** Props passed to the Vue component. */
  props?: Record<string, unknown>;
  className?: string;
}

/**
 * Mounts a Vue 3 component as a client-side island inside the React docs. The component
 * compiles at build time (vue-loader, see next.config.mjs); this wrapper mounts it after
 * hydration and tears it down on unmount, so the static export prerenders an empty host
 * and the demo comes alive in the browser. Mirrors <SvelteDemo>.
 */
export function VueDemo({ component, props, className }: VueDemoProps): ReactElement {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = host.current;
    if (!target) return;
    const app = createApp(component, props ?? {});
    app.mount(target);
    return () => {
      app.unmount();
    };
  }, [component, props]);

  return <div ref={host} className={className} />;
}
