import { useCallback, useRef, useState } from 'react';
import { FileGridItem } from '@/types';

interface FileGridSelectableProps {
  items: FileGridItem[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  children: React.ReactNode;
}

export default function FileGridSelectable({
  items,
  selectedItems,
  onSelectionChange,
  children,
}: FileGridSelectableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = useCallback((selectedIds: string[]) => {
    onSelectionChange(selectedIds);
  }, [onSelectionChange]);

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {children}
      {isSelecting && (
        <div
          ref={marqueeRef}
          className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
        />
      )}
    </div>
  );
}