import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface Crumb {
  id: string;
  name: string;
}

interface BreadcrumbsOverflowProps {
  crumbs: Crumb[];
  onCrumbClick: (crumb: Crumb) => void;
}

export default function BreadcrumbsOverflow({
  crumbs,
  onCrumbClick,
}: BreadcrumbsOverflowProps) {
  if (crumbs.length <= 3) {
    return (
      <div className="flex items-center space-x-1">
        {crumbs.map((crumb, index) => (
          <div key={crumb.id} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <Button
              variant="ghost"
              onClick={() => onCrumbClick(crumb)}
              className="h-auto px-2 py-1"
            >
              {crumb.name}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  const firstCrumb = crumbs[0];
  const lastCrumb = crumbs[crumbs.length - 1];
  const middleCrumbs = crumbs.slice(1, -1);

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        onClick={() => onCrumbClick(firstCrumb)}
        className="h-auto px-2 py-1"
      >
        {firstCrumb.name}
      </Button>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-auto px-2 py-1">
            ...
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <ScrollArea className="h-72">
            <div className="p-4">
              {middleCrumbs.map((crumb) => (
                <Button
                  key={crumb.id}
                  variant="ghost"
                  onClick={() => onCrumbClick(crumb)}
                  className="w-full justify-start"
                >
                  {crumb.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <Button
        variant="ghost"
        onClick={() => onCrumbClick(lastCrumb)}
        className="h-auto px-2 py-1"
      >
        {lastCrumb.name}
      </Button>
    </div>
  );
}
