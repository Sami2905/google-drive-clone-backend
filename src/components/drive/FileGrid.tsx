import { useCallback, useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileGridItem, ViewMode } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface FileGridProps {
  items: FileGridItem[];
  viewMode: ViewMode;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onItemClick?: (item: FileGridItem) => void;
  onItemDoubleClick?: (item: FileGridItem) => void;
}

export default function FileGrid({
  items,
  viewMode,
  selectedItems = [],
  onSelectionChange,
  onItemClick,
  onItemDoubleClick,
}: FileGridProps) {
  const [selection, setSelection] = useState<string[]>(selectedItems);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelection(selectedItems);
  }, [selectedItems]);

  const handleItemClick = useCallback((item: FileGridItem, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const newSelection = selection.includes(item.id)
        ? selection.filter(id => id !== item.id)
        : [...selection, item.id];
      setSelection(newSelection);
      onSelectionChange?.(newSelection);
    } else {
      const newSelection = [item.id];
      setSelection(newSelection);
      onSelectionChange?.(newSelection);
      onItemClick?.(item);
    }
  }, [selection, onSelectionChange, onItemClick]);

  const handleItemDoubleClick = useCallback((item: FileGridItem) => {
    onItemDoubleClick?.(item);
  }, [onItemDoubleClick]);

  const getGridCols = () => {
    switch (viewMode.size) {
      case 'sm': return 'grid-cols-6';
      case 'md': return 'grid-cols-4';
      case 'lg': return 'grid-cols-3';
      default: return 'grid-cols-4';
    }
  };

  const getPadding = () => {
    switch (viewMode.size) {
      case 'sm': return 'p-2';
      case 'md': return 'p-3';
      case 'lg': return 'p-4';
      default: return 'p-3';
    }
  };

  return (
    <div
      ref={gridRef}
      className={`grid ${getGridCols()} gap-4 p-4`}
    >
      {items.map(item => (
        <div
          key={item.id}
          className={`${getPadding()} bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer ${
            selection.includes(item.id) ? 'border-primary' : ''
          }`}
          onClick={(e) => handleItemClick(item, e)}
          onDoubleClick={() => handleItemDoubleClick(item)}
        >
          <div className="flex items-start gap-2">
            <Checkbox
              checked={selection.includes(item.id)}
              onCheckedChange={(checked) =>
                handleItemClick(item, { ctrlKey: true } as React.MouseEvent)
              }
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(item.size)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(item.updated_at)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}