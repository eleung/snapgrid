import type { Layout } from "@snapgrid/react";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT,
  DEFAULT_LAYOUT_MD,
  DEFAULT_LAYOUT_SM,
  DEFAULT_PANELS,
  TEAM_LAYOUT,
  TEAM_LAYOUT_NARROW,
  WIDGETS,
  WIDGET_ORDER,
} from "../widgets";

type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const collisions = (layout: Layout) => {
  const out: string[] = [];
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      if (overlaps(layout[i], layout[j])) out.push(`${layout[i].i} ∩ ${layout[j].i}`);
    }
  }
  return out;
};
const idsOf = (layout: Layout) => layout.map((it) => it.i).sort();

const panelIds = DEFAULT_PANELS.map((p) => p.i).sort();
const typeById = new Map(DEFAULT_PANELS.map((p) => [p.i, p.type]));

// Every designed dashboard breakpoint must be a valid, complete layout.
describe.each([
  { bp: "lg", layout: DEFAULT_LAYOUT, cols: 12 },
  { bp: "md", layout: DEFAULT_LAYOUT_MD, cols: 8 },
  { bp: "sm", layout: DEFAULT_LAYOUT_SM, cols: 4 },
])("showcase $bp dashboard layout", ({ layout, cols }) => {
  it("has no overlapping tiles", () => expect(collisions(layout)).toEqual([]));

  it("keeps every tile inside the grid", () => {
    for (const it of layout) {
      expect(it.x, `${it.i} x`).toBeGreaterThanOrEqual(0);
      expect(it.y, `${it.i} y`).toBeGreaterThanOrEqual(0);
      expect(it.x + it.w, `${it.i} right edge in ${cols} cols`).toBeLessThanOrEqual(cols);
    }
  });

  it("contains every panel exactly once", () => expect(idsOf(layout)).toEqual(panelIds));

  it("respects each widget's min size (clamped to the breakpoint)", () => {
    for (const it of layout) {
      const type = typeById.get(it.i);
      if (!type) continue;
      const def = WIDGETS[type];
      expect(it.w, `${it.i} w in ${cols} cols`).toBeGreaterThanOrEqual(Math.min(def.minW, cols));
      expect(it.h, `${it.i} h`).toBeGreaterThanOrEqual(def.minH);
    }
  });
});

// The nested team grid is responsive too.
const teamIds = TEAM_LAYOUT.map((it) => it.i).sort();
describe.each([
  { bp: "wide", layout: TEAM_LAYOUT, cols: 12 },
  { bp: "narrow", layout: TEAM_LAYOUT_NARROW, cols: 6 },
])("showcase $bp team layout", ({ layout, cols }) => {
  it("has no overlapping members", () => expect(collisions(layout)).toEqual([]));

  it("keeps every member inside the grid", () => {
    for (const it of layout) {
      expect(it.x, `${it.i} x`).toBeGreaterThanOrEqual(0);
      expect(it.x + it.w, `${it.i} right edge in ${cols} cols`).toBeLessThanOrEqual(cols);
    }
  });

  it("contains the same members", () => expect(idsOf(layout)).toEqual(teamIds));
});

describe("showcase registry", () => {
  it("only references widget types that exist", () => {
    for (const p of DEFAULT_PANELS) {
      expect(WIDGETS[p.type], `missing widget def for "${p.type}"`).toBeDefined();
    }
  });

  it("offers every registry widget in the add-widget menu order", () => {
    expect([...WIDGET_ORDER].sort()).toEqual(Object.keys(WIDGETS).sort());
  });
});
