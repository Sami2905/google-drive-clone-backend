import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Home,
  Star,
  Share2,
  Trash2,
  Settings,
  HardDrive,
  FolderTree,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const router = useRouter();

  const handleNavigation = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleNavigation('/dashboard')}
          >
            <Home className="mr-2 h-4 w-4" />
            My Drive
          </Button>
          <div className="mt-4 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/starred')}
            >
              <Star className="mr-2 h-4 w-4" />
              Starred
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/shared')}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Shared
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/trash')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Trash
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Storage
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/storage')}
            >
              <HardDrive className="mr-2 h-4 w-4" />
              Storage Usage
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/folders')}
            >
              <FolderTree className="mr-2 h-4 w-4" />
              Folder Structure
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Settings
          </h2>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation('/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
