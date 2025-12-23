import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1">
      <div className="bg-card border border-border rounded-lg p-1 flex flex-col gap-0.5">
        <button
          onClick={onZoomIn}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="text-[10px] font-mono text-center text-muted-foreground py-1">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={onZoomOut}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-border" />
        <button
          onClick={onReset}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
