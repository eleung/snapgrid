"use client";

import { FRAMEWORKS, type Framework } from "@/lib/frameworks";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

export { FRAMEWORKS, type Framework };

const IDS = FRAMEWORKS.map((f) => f.id) as Framework[];
// Only shipped bindings are valid to restore/select — never resolve to a binding
// whose docs don't exist yet (it would activate a disabled switcher option and point
// framework-agnostic links at 404s).
const AVAILABLE = new Set<Framework>(FRAMEWORKS.filter((f) => f.available).map((f) => f.id));
const DEFAULT: Framework = "react";
const STORAGE_KEY = "snapgrid-framework";

/** The framework segment of a path (`/react/docs/…` → `react`), or null. */
function frameworkFromPath(pathname: string): Framework | null {
  const seg = pathname.split("/")[1];
  return IDS.includes(seg as Framework) ? (seg as Framework) : null;
}

interface FrameworkContextValue {
  /** The active framework: the URL's on a framework page, else the saved choice. */
  framework: Framework;
  /** Whether the current route is a framework-prefixed page. */
  onFrameworkPage: boolean;
  /** Select a framework: persist it, and on a framework page hop to the twin URL. */
  select: (next: Framework) => void;
}

const Ctx = createContext<FrameworkContextValue | null>(null);

export function FrameworkProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [stored, setStored] = useState<Framework>(DEFAULT);

  // Hydrate the saved preference after mount (SSR renders the default so the markup
  // matches; the preference only affects framework-agnostic pages like the home).
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && AVAILABLE.has(saved as Framework)) setStored(saved as Framework);
  }, []);

  // On a framework page the URL is authoritative — record it as the preference so
  // framework-agnostic pages (home, showcase) follow where you last were.
  const fromPath = frameworkFromPath(pathname);
  useEffect(() => {
    if (fromPath && fromPath !== stored) {
      setStored(fromPath);
      window.localStorage.setItem(STORAGE_KEY, fromPath);
    }
  }, [fromPath, stored]);

  const framework = fromPath ?? stored;

  const select = (next: Framework) => {
    if (next === framework) return;
    setStored(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    // On a framework page, jump to the equivalent page under the new prefix.
    if (fromPath) router.push(pathname.replace(`/${fromPath}/`, `/${next}/`));
  };

  return (
    <Ctx.Provider value={{ framework, onFrameworkPage: fromPath != null, select }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFramework(): FrameworkContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFramework must be used within a FrameworkProvider");
  return ctx;
}
