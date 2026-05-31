import { DragDropProvider } from "@dnd-kit/react";
import { type ReactNode, useRef } from "react";
import { type GridRegistry, SnapGridGroupContext, createGridRegistry } from "./grouping.js";

export interface SnapGridGroupProps {
  children: ReactNode;
}

/**
 * Wrap multiple grids to let tiles be dragged **between** them. Provides one
 * shared dnd-kit `DragDropProvider` and a registry so each grid can tell which
 * grid the pointer is over.
 *
 * Item ids must be unique across all grids in a group (they share one manager).
 */
export function SnapGridGroup({ children }: SnapGridGroupProps): React.JSX.Element {
  const registryRef = useRef<GridRegistry | null>(null);
  if (!registryRef.current) registryRef.current = createGridRegistry();
  return (
    <DragDropProvider>
      <SnapGridGroupContext.Provider value={registryRef.current}>
        {children}
      </SnapGridGroupContext.Provider>
    </DragDropProvider>
  );
}
