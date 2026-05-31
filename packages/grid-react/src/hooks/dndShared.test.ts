import { describe, expect, it } from "vitest";
import { RESIZE_HANDLE_ATTR, shouldPreventItemDrag } from "./dndShared.js";

// <div class="item">
//   <div class="grip" />
//   <div class="body"><button class="no-drag" /></div>
//   <span data-snapgrid-resize-handle />
// </div>
function buildItem() {
  const item = document.createElement("div");
  item.className = "item";
  const grip = document.createElement("div");
  grip.className = "grip";
  const body = document.createElement("div");
  body.className = "body";
  const button = document.createElement("button");
  button.className = "no-drag";
  body.appendChild(button);
  const resize = document.createElement("span");
  resize.setAttribute(RESIZE_HANDLE_ATTR, "");
  item.append(grip, body, resize);
  return { item, grip, body, button, resize };
}

describe("shouldPreventItemDrag", () => {
  it("returns false for a plain pointer-down with no config", () => {
    const { body } = buildItem();
    expect(shouldPreventItemDrag(body, undefined)).toBe(false);
  });

  it("always prevents a move starting on a resize handle", () => {
    const { resize } = buildItem();
    expect(shouldPreventItemDrag(resize, undefined)).toBe(true);
    expect(shouldPreventItemDrag(resize, { handle: ".grip" })).toBe(true);
  });

  it("with `handle`, only allows drags starting within the handle", () => {
    const { grip, body, button } = buildItem();
    const cfg = { handle: ".grip" };
    expect(shouldPreventItemDrag(grip, cfg)).toBe(false);
    expect(shouldPreventItemDrag(body, cfg)).toBe(true);
    expect(shouldPreventItemDrag(button, cfg)).toBe(true);
  });

  it("with `cancel`, blocks drags starting within the cancel region", () => {
    const { button, body } = buildItem();
    const cfg = { cancel: ".no-drag" };
    expect(shouldPreventItemDrag(button, cfg)).toBe(true);
    expect(shouldPreventItemDrag(body, cfg)).toBe(false);
  });

  it("ignores non-Element targets", () => {
    expect(shouldPreventItemDrag(null, { handle: ".grip" })).toBe(false);
  });
});
