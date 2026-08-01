import type { ComponentPublicInstance } from "vue";

/** What Vue hands a template function ref: an element, a component, or null on teardown. */
export type RefTarget = Element | ComponentPublicInstance | null | undefined;

/** Normalize a Vue function-ref argument to the underlying HTMLElement (or null). */
export function toElement(value: RefTarget): HTMLElement | null {
  if (!value) return null;
  const el = value instanceof Element ? value : ((value as ComponentPublicInstance).$el as unknown);
  return el instanceof HTMLElement ? el : null;
}
