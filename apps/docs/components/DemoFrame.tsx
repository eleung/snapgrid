"use client";

import { ExternalLink } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { openInStackBlitz } from "./stackblitz";

/**
 * Chrome for a live example: a titled bar over a dotted "stage". Children mount
 * client-side only — the demos drive dnd-kit + ResizeObserver, which need the
 * DOM, so we skip SSR and avoid hydration mismatches (a sized placeholder keeps
 * layout shift minimal).
 */
export function DemoFrame({
  title,
  hint,
  stageMinHeight = 260,
  code,
  stackblitz = true,
  children,
}: {
  title: string;
  hint?: string;
  stageMinHeight?: number;
  /** Highlighted source for the "Code" toggle (from generated/example-code). */
  code?: { html: string; raw: string };
  /**
   * Show the "Open in StackBlitz" button (needs `code`). Off for non-React demos:
   * the sandbox builder emits a Vite + React project, so it can't run e.g. a
   * `.svelte` source. The Preview/Code toggle still works.
   */
  stackblitz?: boolean;
  children: ReactNode;
}) {
  const mounted = useMounted();
  const [view, setView] = useState<"preview" | "code">("preview");
  return (
    <div className="dg-demo">
      <div className="dg-demo__bar">
        <span className="dg-demo__title">{title}</span>
        <div className="dg-demo__baraside">
          {hint && view === "preview" ? <span className="dg-demo__hint">{hint}</span> : null}
          {code ? (
            <div className="dg-codetabs" role="tablist" aria-label="Preview or code">
              {(["preview", "code"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  className="dg-codetab"
                  data-active={view === v || undefined}
                  onClick={() => setView(v)}
                >
                  {v === "preview" ? "Preview" : "Code"}
                </button>
              ))}
            </div>
          ) : null}
          {code && stackblitz ? (
            <button
              type="button"
              className="dg-demo__sb"
              onClick={() => openInStackBlitz(title, code.raw)}
              title="Open in StackBlitz"
              aria-label="Open in StackBlitz"
            >
              <ExternalLink size={15} strokeWidth={1.75} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      {code && view === "code" ? (
        <CodeView code={code} />
      ) : (
        <div className="dg-demo__stage" style={{ minHeight: stageMinHeight }}>
          {mounted ? children : null}
        </div>
      )}
    </div>
  );
}

function CodeView({ code }: { code: { html: string; raw: string } }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="dg-democode">
      <button
        type="button"
        className="dg-copy"
        onClick={() => {
          navigator.clipboard?.writeText(code.raw).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          });
        }}
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own source files, not user input. */}
      <div className="dg-democode__scroll" dangerouslySetInnerHTML={{ __html: code.html }} />
    </div>
  );
}

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function Tile({
  label,
  meta,
  accent,
  isStatic,
}: {
  label: string;
  meta?: string;
  accent?: boolean;
  isStatic?: boolean;
}) {
  return (
    <div
      className={`dg-tile${accent ? " dg-tile--accent" : ""}${isStatic ? " dg-tile--static" : ""}`}
    >
      <span className="dg-tile__label">{label}</span>
      {meta ? <span className="dg-tile__meta">{meta}</span> : null}
    </div>
  );
}

export function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="dg-btn" data-active={active || undefined} onClick={onClick}>
      {children}
    </button>
  );
}

export const ROW: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  marginBottom: "0.8rem",
};
