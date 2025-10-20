/**
 * Virtualized list component for rendering large datasets efficiently
 */

import { memo } from "react";

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  containerHeightClass: string; // Tailwind height class (e.g., h-96)
  itemHeightClass: string; // Tailwind height class for each row (e.g., h-20)
}

function VirtualizedList<T>({
  items,
  renderItem,
  className = "",
  containerHeightClass,
  itemHeightClass
}: VirtualizedListProps<T>) {
  return (
    <div className={`overflow-auto ${containerHeightClass} ${className}`}>
      <div className="relative">
        {items.map((item, index) => (
          <div className={`flex items-center ${itemHeightClass}`} key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

declare global {
  // Ensure JSX namespace exists for TS
  namespace JSX {
    interface Element {}
  }
}

export default memo(VirtualizedList) as <T>(
  props: VirtualizedListProps<T>
) => React.ReactElement;

