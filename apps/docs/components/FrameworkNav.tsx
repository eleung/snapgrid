"use client";

import { useFramework } from "@/components/FrameworkProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Framework-aware "Docs" and "Examples" navbar links: docs + examples live under
// per-framework folders (/react/…, /svelte/…), so these follow the active framework
// (the URL's on a framework page, else the saved switcher preference). Rendered as
// Navbar children (see app/(site)/layout.tsx) so they sit inline with the static
// Showcase/Roadmap/Changelog page links — the class list mirrors Nextra's own nav
// links (incl. the aria-[current] active styling). The `dg-navlink` marker opts these
// out of the CSS that hides Nextra's auto-generated /react//svelte/ framework tabs
// (globals.css) — without it, a `/svelte/docs…` href would be hidden too.
const NAV_LINK =
  "dg-navlink x:focus-visible:nextra-focus x:text-sm x:contrast-more:text-gray-700 x:contrast-more:dark:text-gray-100 x:whitespace-nowrap x:text-gray-600 x:hover:text-black x:dark:text-gray-400 x:dark:hover:text-gray-200 x:ring-inset x:transition-colors x:aria-[current]:font-medium x:aria-[current]:subpixel-antialiased x:aria-[current]:text-current";

export function FrameworkNav() {
  const { framework } = useFramework();
  const pathname = usePathname();
  const prefix = `/${framework}`;
  return (
    <>
      <Link
        href={`${prefix}/docs/getting-started`}
        className={NAV_LINK}
        aria-current={pathname.startsWith(`${prefix}/docs`) ? "page" : undefined}
      >
        Documentation
      </Link>
      <Link
        href={`${prefix}/examples`}
        className={NAV_LINK}
        aria-current={pathname.startsWith(`${prefix}/examples`) ? "page" : undefined}
      >
        Examples
      </Link>
    </>
  );
}
