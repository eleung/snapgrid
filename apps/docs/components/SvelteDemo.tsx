"use client";

import { type ReactElement, useEffect, useRef } from "react";
import { type Component, mount, unmount } from "svelte";

interface SvelteDemoProps {
  /** A compiled Svelte component (default import from a `.svelte` file). */
  component: Component<Record<string, unknown>>;
  /** Props passed to the Svelte component. */
  props?: Record<string, unknown>;
  className?: string;
}

/**
 * Mounts a Svelte 5 component as a client-side island inside the React docs. The
 * component compiles at build time (svelte-loader, see next.config.mjs); this
 * wrapper mounts it after hydration and tears it down on unmount, so the static
 * export prerenders an empty host and the demo comes alive in the browser.
 */
export function SvelteDemo({ component, props, className }: SvelteDemoProps): ReactElement {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = host.current;
    if (!target) return;
    const app = mount(component, { target, props: props ?? {} });
    return () => {
      unmount(app);
    };
  }, [component, props]);

  return <div ref={host} className={className} />;
}
