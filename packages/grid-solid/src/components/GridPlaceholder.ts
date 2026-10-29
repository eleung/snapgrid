import { type Accessor, type JSX, Show, createComponent, mergeProps, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { type GridPlaceholderInfo, useGridPlaceholder } from "../hooks/useGridPlaceholder.js";
import { REFLOW_TRANSITION } from "../reflow.js";

const DEFAULT_LOOK: JSX.CSSProperties = {
  background: "rgba(99, 102, 241, 0.2)",
  border: "1px dashed rgba(99, 102, 241, 0.6)",
  "border-radius": "4px",
  "box-sizing": "border-box",
  "z-index": 2,
  transition: REFLOW_TRANSITION,
};

// `<Show>` is overloaded (keyed / non-keyed), which `createComponent` can't resolve; pin
// the non-keyed form, so the element persists (and its transition runs) as the
// placeholder moves instead of remounting on every change.
type NonKeyedShow<T> = (props: {
  when: T | undefined | null | false;
  children: (item: Accessor<NonNullable<T>>) => JSX.Element;
}) => JSX.Element;

export interface GridPlaceholderProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "style" | "ref" | "children"> {
  /** The owning grid's id (from its useGridContainer). */
  group: string;
  /** Merged over the placeholder's positioning and default look. */
  style?: JSX.CSSProperties;
}

/**
 * The landing-cell marker shown while a drag is in progress; renders nothing when the
 * grid is idle. `class`, `style` and other `<div>` attributes merge onto the element.
 */
export function GridPlaceholder(props: GridPlaceholderProps): JSX.Element {
  const [local, others] = splitProps(props, ["group", "class", "style"]);
  // `group` is the stable grid id for this placeholder's lifetime.
  const placeholder = useGridPlaceholder(local.group);

  return createComponent(Show as NonKeyedShow<GridPlaceholderInfo>, {
    get when() {
      return placeholder();
    },
    children: (current) =>
      createComponent(
        Dynamic,
        mergeProps(others, {
          component: "div",
          "aria-hidden": "true",
          get class() {
            return local.class ? `snapgrid-placeholder ${local.class}` : "snapgrid-placeholder";
          },
          get style() {
            return { ...current().style, ...DEFAULT_LOOK, ...local.style };
          },
        }),
      ),
  });
}
