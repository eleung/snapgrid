"use client";

import { GridLayout, type Layout } from "@snapgrid/react";
import { useEffect, useRef, useState } from "react";
import { useMounted } from "./DemoFrame";

// Easter egg: the snapgrid logo mark is a live snapgrid. The four brand squares
// are draggable tiles you can rearrange — snapgrid driving its own logo. A tap
// still navigates home (the drag threshold disambiguates click vs drag). The
// mark stays decorative (aria-hidden), so it adds no tab stops or SR noise.
const MARK: Layout = [
  { i: "a", x: 0, y: 0, w: 1, h: 1 },
  { i: "b", x: 1, y: 0, w: 1, h: 1 },
  { i: "c", x: 0, y: 1, w: 1, h: 1 },
  { i: "d", x: 1, y: 1, w: 1, h: 1 },
];
// Per-tile opacity (so the colors travel with the squares as they rearrange),
// matching the static mark's resting look: TL .9, TR .4, BL .55, BR .9.
const OPACITY: Record<string, number> = { a: 0.9, b: 0.4, c: 0.55, d: 0.9 };

export function DraggableLogoMark() {
  const mounted = useMounted();
  const [layout, setLayout] = useState<Layout>(MARK);
  const didDrag = useRef(false);
  const markRef = useRef<HTMLSpanElement>(null);

  // The mark is decorative (aria-hidden), so keep snapgrid's keyboard-draggable
  // tiles out of the tab order — otherwise they'd add header tab stops and be
  // focusable-inside-aria-hidden. Pointer dragging is unaffected by tabindex. A
  // MutationObserver re-applies it across snapgrid's re-renders.
  useEffect(() => {
    const root = markRef.current;
    if (!mounted || !root) return;
    const strip = () => {
      for (const el of root.querySelectorAll(".snapgrid-item")) {
        if (el.getAttribute("tabindex") !== "-1") el.setAttribute("tabindex", "-1");
      }
    };
    strip();
    const observer = new MutationObserver(strip);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["tabindex"],
    });
    return () => observer.disconnect();
  }, [mounted]);

  // SSR / pre-hydration: the plain static mark — identical look, zero layout shift.
  if (!mounted) {
    return (
      <span className="dg-logo__mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
    );
  }

  return (
    <span
      ref={markRef}
      className="dg-logo__mark--live"
      aria-hidden="true"
      // If a click is the tail end of a drag, swallow it so the logo link doesn't
      // navigate home. A plain click (no drag) passes through untouched.
      onClickCapture={(e) => {
        if (didDrag.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <GridLayout
        layout={layout}
        width={18}
        onLayoutChange={setLayout}
        gridConfig={{ cols: 2, rowHeight: 8, margin: [2, 2], containerPadding: [0, 0] }}
        isResizable={false}
        dragConfig={{ threshold: 3 }}
        onDragStart={() => {
          didDrag.current = true;
        }}
        onDragStop={() => {
          // Clear only after the click that may follow pointerup has been swallowed.
          setTimeout(() => {
            didDrag.current = false;
          }, 0);
        }}
      >
        {layout.map((it) => (
          <span key={it.i} className="dg-logo__tile" style={{ opacity: OPACITY[it.i] }} />
        ))}
      </GridLayout>
    </span>
  );
}
