import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Sun,
  Contrast,
  Palette,
  RefreshCw,
} from 'lucide-react';

interface ImageViewerProps {
  url: string;
  onClose?: () => void;
}

export default function ImageViewer({ url, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(5, prev + 0.1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.1, prev - 0.1));
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation(prev => (prev - 90 + 360) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRotateRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleRotateRight]);

  const imageStyle = {
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    transition: 'transform 0.2s ease-in-out, filter 0.2s ease-in-out',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRotateLeft}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRotateRight}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={url}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            style={imageStyle}
          />
        </div>
      </div>
      <div className="p-4 border-t space-y-4">
        <div className="flex items-center space-x-4">
          <Sun className="h-4 w-4" />
          <Slider
            value={[brightness]}
            onValueChange={(value) => setBrightness(value[0])}
            min={0}
            max={200}
            step={1}
            className="flex-1"
          />
        </div>
        <div className="flex items-center space-x-4">
          <Contrast className="h-4 w-4" />
          <Slider
            value={[contrast]}
            onValueChange={(value) => setContrast(value[0])}
            min={0}
            max={200}
            step={1}
            className="flex-1"
          />
        </div>
        <div className="flex items-center space-x-4">
          <Palette className="h-4 w-4" />
          <Slider
            value={[saturation]}
            onValueChange={(value) => setSaturation(value[0])}
            min={0}
            max={200}
            step={1}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}