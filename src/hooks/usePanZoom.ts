import { useCallback, useEffect, useRef, useState } from 'react';

interface PanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
  panSpeed?: number;
}

export function usePanZoom({
  minZoom = 0.1,
  maxZoom = 5,
  zoomSpeed = 0.1,
  panSpeed = 1,
}: PanZoomOptions = {}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * zoomSpeed * 0.01;
    setScale(s => Math.max(minZoom, Math.min(maxZoom, s + delta)));
  }, [maxZoom, minZoom, zoomSpeed]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    const dx = (e.clientX - lastPosition.current.x) * panSpeed;
    const dy = (e.clientY - lastPosition.current.y) * panSpeed;

    setPosition(pos => ({
      x: pos.x + dx,
      y: pos.y + dy,
    }));

    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, [panSpeed]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    containerRef,
    scale,
    setScale,
    rotation,
    setRotation,
    position,
    setPosition,
    tx: position.x,
    ty: position.y,
    reset,
  };
}