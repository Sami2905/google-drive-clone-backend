import { useCallback, useEffect, useRef, useState } from 'react';

interface MarqueeSelectOptions {
  onSelect?: (selectedIds: string[]) => void;
  containerRef: React.RefObject<HTMLElement>;
}

export function useMarqueeSelect({ onSelect, containerRef }: MarqueeSelectOptions) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const startPoint = useRef({ x: 0, y: 0 });
  const marqueeRef = useRef<HTMLDivElement>(null);

  const updateMarquee = useCallback((e: MouseEvent) => {
    if (!isSelecting || !marqueeRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = Math.min(startPoint.current.x, e.clientX - containerRect.left);
    const y = Math.min(startPoint.current.y, e.clientY - containerRect.top);
    const width = Math.abs(e.clientX - containerRect.left - startPoint.current.x);
    const height = Math.abs(e.clientY - containerRect.top - startPoint.current.y);

    marqueeRef.current.style.left = `${x}px`;
    marqueeRef.current.style.top = `${y}px`;
    marqueeRef.current.style.width = `${width}px`;
    marqueeRef.current.style.height = `${height}px`;

    // Find elements within the marquee
    const marqueeRect = marqueeRef.current.getBoundingClientRect();
    const selectableElements = containerRef.current.querySelectorAll('[data-selectable-id]');
    const newSelectedIds: string[] = [];

    selectableElements.forEach((element) => {
      const elementRect = element.getBoundingClientRect();
      if (
        elementRect.left < marqueeRect.right &&
        elementRect.right > marqueeRect.left &&
        elementRect.top < marqueeRect.bottom &&
        elementRect.bottom > marqueeRect.top
      ) {
        const id = element.getAttribute('data-selectable-id');
        if (id) newSelectedIds.push(id);
      }
    });

    setSelectedIds(newSelectedIds);
    onSelect?.(newSelectedIds);
  }, [isSelecting, containerRef, onSelect]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    startPoint.current = {
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    };
    setIsSelecting(true);
  }, [containerRef]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', updateMarquee);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', updateMarquee);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, handleMouseDown, handleMouseUp, updateMarquee]);

  return {
    isSelecting,
    selectedIds,
    marqueeRef,
  };
}
