import { ActivationController } from "@dnd-kit/abstract";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TOUCH_HOLD,
  RESIZE_HANDLE_ATTR,
  TOUCH_HOLD_TOLERANCE,
  buildActivationConstraints,
  shouldPreventItemDrag,
} from "../dndShared.js";
import type { DragConfig } from "../types.js";

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

// Constraints only read `type` and `clientX`/`clientY`, so plain objects stand in
// for PointerEvents (jsdom has no PointerEvent, and dnd-kit never reads more here).
const pointer = (type: string, x = 0, y = 0) => ({ type, clientX: x, clientY: y }) as PointerEvent;

/** Drives a constraint list through dnd-kit's real activation controller. */
function gesture(pointerType: string, threshold = 3, cfg?: DragConfig) {
  let armed = 0;
  const controller = new ActivationController<PointerEvent>(
    buildActivationConstraints(pointerType, threshold, cfg),
    () => {
      armed += 1;
    },
  );
  return { controller, armed: () => armed };
}

describe("buildActivationConstraints", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("makes a touch wait out the hold before it arms", () => {
    const { controller, armed } = gesture("touch");
    controller.onEvent(pointer("pointerdown"));
    expect(armed()).toBe(0);

    vi.advanceTimersByTime(DEFAULT_TOUCH_HOLD - 1);
    expect(armed()).toBe(0);

    vi.advanceTimersByTime(1);
    expect(armed()).toBe(1);
  });

  it("takes the hold time from dragConfig.touchHold", () => {
    const { controller, armed } = gesture("touch", 3, { touchHold: 600 });
    controller.onEvent(pointer("pointerdown"));

    vi.advanceTimersByTime(DEFAULT_TOUCH_HOLD);
    expect(armed()).toBe(0);

    vi.advanceTimersByTime(600 - DEFAULT_TOUCH_HOLD);
    expect(armed()).toBe(1);
  });

  it("never arms a touch that moves past the tolerance — that gesture is a scroll", () => {
    const { controller, armed } = gesture("touch");
    controller.onEvent(pointer("pointerdown"));
    controller.onEvent(pointer("pointermove", 0, TOUCH_HOLD_TOLERANCE + 1));

    vi.advanceTimersByTime(DEFAULT_TOUCH_HOLD * 4);
    expect(armed()).toBe(0);
  });

  it("survives the jitter of a finger held within the tolerance", () => {
    const { controller, armed } = gesture("touch");
    controller.onEvent(pointer("pointerdown"));
    controller.onEvent(pointer("pointermove", TOUCH_HOLD_TOLERANCE, 0));

    vi.advanceTimersByTime(DEFAULT_TOUCH_HOLD);
    expect(armed()).toBe(1);
  });

  it("never arms a touch that lifts before the hold elapses", () => {
    const { controller, armed } = gesture("touch");
    controller.onEvent(pointer("pointerdown"));
    controller.onEvent(pointer("pointerup"));

    vi.advanceTimersByTime(DEFAULT_TOUCH_HOLD * 4);
    expect(armed()).toBe(0);
  });

  it("arms the mouse on the distance threshold, with no hold at all", () => {
    const { controller, armed } = gesture("mouse");
    controller.onEvent(pointer("pointerdown"));
    expect(armed()).toBe(0);

    controller.onEvent(pointer("pointermove", 3, 0));
    expect(armed()).toBe(0);

    controller.onEvent(pointer("pointermove", 4, 0));
    expect(armed()).toBe(1);
  });

  it("treats a pen like the mouse", () => {
    const { controller, armed } = gesture("pen");
    controller.onEvent(pointer("pointerdown"));
    controller.onEvent(pointer("pointermove", 4, 0));
    expect(armed()).toBe(1);
  });

  it("with touchHold: 0, arms a touch by movement instead of by hold", () => {
    const { controller, armed } = gesture("touch", 3, { touchHold: 0 });
    controller.onEvent(pointer("pointerdown"));

    vi.advanceTimersByTime(DEFAULT_TOUCH_HOLD * 4);
    expect(armed()).toBe(0);

    controller.onEvent(pointer("pointermove", 4, 0));
    expect(armed()).toBe(1);
  });

  it("arms on pointer-down when both the hold and the threshold are off", () => {
    const { controller, armed } = gesture("touch", 0, { touchHold: 0 });
    controller.onEvent(pointer("pointerdown"));
    expect(armed()).toBe(1);
  });
});
