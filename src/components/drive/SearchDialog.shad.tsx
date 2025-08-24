import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchParams } from '@/types';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (params: SearchParams) => void;
  currentFolderId?: string;
}

export default function SearchDialog({
  open,
  onOpenChange,
  onSearch,
  currentFolderId,
}: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [includeSubfolders, setIncludeSubfolders] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sizeMin, setSizeMin] = useState('');
  const [sizeMax, setSizeMax] = useState('');

  const handleSearch = () => {
    onSearch({
      query,
      folder_id: currentFolderId,
      include_subfolders: includeSubfolders,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sizeMin: sizeMin ? parseInt(sizeMin) : undefined,
      sizeMax: sizeMax ? parseInt(sizeMax) : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search Files</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Search Query</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search terms..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={includeSubfolders}
              onCheckedChange={setIncludeSubfolders}
            />
            <Label>Include subfolders</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Size (bytes)</Label>
              <Input
                type="number"
                value={sizeMin}
                onChange={(e) => setSizeMin(e.target.value)}
              />
            </div>
            <div>
              <Label>Max Size (bytes)</Label>
              <Input
                type="number"
                value={sizeMax}
                onChange={(e) => setSizeMax(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSearch} className="w-full">
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}