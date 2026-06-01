import { describe, expect, it } from "vitest";
import { externalDropSpec } from "./dragFlow.js";

const ext = { id: "palette-x", data: { snapGridDrop: { w: 4, h: 2 } } };
const gridItem = { id: "a", data: { snapGrid: { kind: "move", itemId: "a" } } };

describe("externalDropSpec", () => {
  it("returns null when dropConfig is disabled", () => {
    expect(externalDropSpec(ext, undefined)).toBeNull();
    expect(externalDropSpec(ext, { enabled: false })).toBeNull();
  });

  it("returns null for a grid item (it carries snapGrid)", () => {
    expect(externalDropSpec(gridItem, { enabled: true })).toBeNull();
  });

  it("uses the source's snapGridDrop size when present", () => {
    expect(externalDropSpec(ext, { enabled: true, defaultItem: { w: 1, h: 1 } })).toEqual({
      i: undefined,
      w: 4,
      h: 2,
    });
  });

  it("falls back to defaultItem, then to react-grid-layout's 1×1 default", () => {
    const bare = { id: "p", data: {} };
    expect(externalDropSpec(bare, { enabled: true, defaultItem: { w: 3, h: 5 } })).toEqual({
      i: undefined,
      w: 3,
      h: 5,
    });
    expect(externalDropSpec(bare, { enabled: true })).toEqual({ i: undefined, w: 1, h: 1 });
  });

  it("honors the accept predicate", () => {
    const cfg = {
      enabled: true,
      accept: (s: { id: string | number }) => String(s.id).startsWith("ok-"),
    };
    expect(externalDropSpec({ id: "ok-1", data: {} }, cfg)).not.toBeNull();
    expect(externalDropSpec({ id: "no-1", data: {} }, cfg)).toBeNull();
  });
});
