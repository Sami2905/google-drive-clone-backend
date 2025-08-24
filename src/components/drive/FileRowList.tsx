import { useCallback, useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileGridItem } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';

interface FileRowListProps {
  items: FileGridItem[];
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onItemClick?: (item: FileGridItem) => void;
  onItemDoubleClick?: (item: FileGridItem) => void;
}

export default function FileRowList({
  items,
  selectedItems = [],
  onSelectionChange,
  onItemClick,
  onItemDoubleClick,
}: FileRowListProps) {
  const [selection, setSelection] = useState<string[]>(selectedItems);

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

  return (
    <div className="space-y-1">
      {items.map(item => (
        <div
          key={item.id}
          className={`flex items-center p-2 rounded-lg hover:bg-accent cursor-pointer ${
            selection.includes(item.id) ? 'bg-accent' : ''
          }`}
          onClick={(e) => handleItemClick(item, e)}
          onDoubleClick={() => handleItemDoubleClick(item)}
        >
          <Checkbox
            checked={selection.includes(item.id)}
            onCheckedChange={(checked) =>
              handleItemClick(item, { ctrlKey: true } as React.MouseEvent)
            }
            onClick={(e) => e.stopPropagation()}
            className="mr-2"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>{formatFileSize(item.size)}</span>
              <span>{formatDate(item.updated_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
