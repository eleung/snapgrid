import {
  type CSSProperties,
  Children,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from "react";
import { GridDragOverlay } from "./GridDragOverlay.js";
import { GridItem } from "./GridItem.js";
import { GridPlaceholder } from "./GridPlaceholder.js";
import { SnapGridProvider, type SnapGridProviderProps } from "./SnapGridProvider.js";
import { useGridContainer } from "./hooks/useGridContainer.js";

export interface GridLayoutProps extends SnapGridProviderProps {
  /** Appended to the default `snapgrid` class on the surface. */
  className?: string;
  /** Merged over (and able to override) the surface's positioning style. */
  style?: CSSProperties;
}

/** Strip the namespacing prefix React applies to keys inside `Children.map`. */
function keyToId(key: string): string {
  return key.startsWith(".$") ? key.slice(2) : key;
}

/** The default surface: positioned container + mapped items + placeholder. */
function GridSurface({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { containerProps } = useGridContainer();
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
          <GridItem key={child.key} id={keyToId(String(child.key))}>
            {child}
          </GridItem>
        );
      })}
      <GridPlaceholder />
      <GridDragOverlay>{(item) => childById.get(item.i) ?? null}</GridDragOverlay>
    </div>
  );
}

/**
 * Drop-in grid component: a controlled, react-grid-layout v2-compatible layout
 * backed by dnd-kit. A thin shell over {@link SnapGridProvider} and the headless
 * hooks — children are keyed by their layout item's `i`. For full control over
 * markup/styling, use the provider + hooks directly.
 */
export function GridLayout(props: GridLayoutProps): React.JSX.Element {
  const { className, style, children, ...providerProps } = props;
  return (
    <SnapGridProvider {...providerProps}>
      <GridSurface className={className} style={style}>
        {children}
      </GridSurface>
    </SnapGridProvider>
  );
}
