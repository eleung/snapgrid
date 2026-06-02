import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import {
  type CSSProperties,
  Children,
  type ReactElement,
  type ReactNode,
  createContext,
  isValidElement,
  useContext,
} from "react";
import { GridItem } from "./GridItem.js";
import { GridPlaceholder } from "./GridPlaceholder.js";
import { dragOverlayStyle } from "./dragOverlayStyle.js";
import { useGridContainer } from "./hooks/useGridContainer.js";
import type { UseGridControllerOptions } from "./hooks/useGridController.js";

export interface GridLayoutProps extends UseGridControllerOptions {
  children: ReactNode;
  /** Appended to the default `snapgrid` class on the surface. */
  className?: string;
  /** Merged over (and able to override) the surface's positioning style. */
  style?: CSSProperties;
}

// Marks that a snapgrid-managed <DragDropProvider> already exists above, so a
// nested GridLayout (or sibling sharing one) doesn't mint a second manager.
const InProvider = createContext(false);

/** Strip the namespacing prefix React applies to keys inside `Children.map`. */
function keyToId(key: string): string {
  return key.startsWith(".$") ? key.slice(2) : key;
}

/** The default surface: positioned container + mapped items + placeholder + overlay. */
function GridSurface({ className, style, children, ...opts }: GridLayoutProps) {
  const { containerProps, group } = useGridContainer(opts);
  // Map item id -> child so the drag overlay can render the dragged tile's content.
  const childById = new Map<string, ReactElement>();
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.key != null) {
      childById.set(keyToId(String(child.key)), child);
    }
  });
  return (
    <div
      {...containerProps}
      className={className ? `snapgrid ${className}` : "snapgrid"}
      style={style ? { ...containerProps.style, ...style } : containerProps.style}
    >
      {Children.map(children, (child) => {
        if (!isValidElement(child) || child.key == null) return child;
        return (
          <GridItem key={child.key} id={keyToId(String(child.key))} group={group}>
            {child}
          </GridItem>
        );
      })}
      <GridPlaceholder group={group} />
      <DragOverlay style={dragOverlayStyle}>
        {(source) => (source ? (childById.get(String(source.id)) ?? null) : null)}
      </DragOverlay>
    </div>
  );
}

/**
 * Drop-in grid component: a controlled, react-grid-layout v2-compatible layout
 * backed by dnd-kit. A thin shell over {@link useGridContainer} and the headless
 * hooks — children are keyed by their layout item's `i`. For full control over
 * markup/styling, use the hooks directly.
 *
 * Supplies the dnd-kit `DragDropProvider` for the turnkey case so consumers
 * don't manage one. Nest multiple `GridLayout`s and they share one provider
 * (the seam for cross-grid drags); a consumer's own provider is also honored.
 */
export function GridLayout(props: GridLayoutProps): React.JSX.Element {
  const inProvider = useContext(InProvider);
  const surface = <GridSurface {...props} />;
  if (inProvider) return surface;
  return (
    <DragDropProvider>
      <InProvider.Provider value={true}>{surface}</InProvider.Provider>
    </DragDropProvider>
  );
}

/**
 * Share one dnd-kit `DragDropProvider` across several sibling grids so tiles can
 * be dragged between them. (Nested `GridLayout`s already share a provider; this
 * is for siblings.) A thin wrapper over `DragDropProvider` — the cross-grid seam
 * is now the shared manager + collision target, not a geometry registry.
 */
export function SnapGridGroup({ children }: { children: ReactNode }): React.JSX.Element {
  const inProvider = useContext(InProvider);
  if (inProvider) return <>{children}</>;
  return (
    <DragDropProvider>
      <InProvider.Provider value={true}>{children}</InProvider.Provider>
    </DragDropProvider>
  );
}
