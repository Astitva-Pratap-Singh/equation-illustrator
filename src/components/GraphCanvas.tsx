import { useEffect, useRef, useCallback } from 'react';
import { Polynomial, evaluatePolynomial } from '@/lib/polynomial';

interface GraphCanvasProps {
  polynomials: Polynomial[];
  zoom: number;
  panX: number;
  panY: number;
  onPan: (deltaX: number, deltaY: number) => void;
  isDark: boolean;
}

export function GraphCanvas({ polynomials, zoom, panX, panY, onPan, isDark }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2 + panX;
    const centerY = height / 2 + panY;
    const scale = 50 * zoom;

    // Colors based on theme
    const bgColor = isDark ? '#0f0f0f' : '#ffffff';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const axisColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
    const labelColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    const gridSpacing = scale;
    const startX = centerX % gridSpacing;
    const startY = centerY % gridSpacing;

    for (let x = startX; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = startY; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = labelColor;
    ctx.font = '11px IBM Plex Mono, monospace';
    ctx.textAlign = 'center';

    const xStart = Math.floor(-centerX / scale);
    const xEnd = Math.ceil((width - centerX) / scale);
    for (let i = xStart; i <= xEnd; i++) {
      if (i === 0) continue;
      const x = centerX + i * scale;
      ctx.fillText(i.toString(), x, centerY + 16);
    }

    ctx.textAlign = 'right';
    const yStart = Math.floor(-centerY / scale);
    const yEnd = Math.ceil((height - centerY) / scale);
    for (let i = yStart; i <= yEnd; i++) {
      if (i === 0) continue;
      const y = centerY - i * scale;
      ctx.fillText(i.toString(), centerX - 8, y + 4);
    }

    // Draw polynomials
    polynomials.forEach((poly) => {
      if (!poly.visible || poly.coefficients.length === 0) return;

      ctx.strokeStyle = poly.color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      let isFirst = true;

      for (let px = 0; px < width; px++) {
        const x = (px - centerX) / scale;
        const y = evaluatePolynomial(poly.coefficients, x);
        const py = centerY - y * scale;

        if (py < -1000 || py > height + 1000) {
          isFirst = true;
          continue;
        }

        if (isFirst) {
          ctx.moveTo(px, py);
          isFirst = false;
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.stroke();
    });
  }, [polynomials, zoom, panX, panY, isDark]);

  useEffect(() => {
    drawGraph();
    
    const handleResize = () => drawGraph();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawGraph]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastPos.current.x;
    const deltaY = e.clientY - lastPos.current.y;
    
    onPan(deltaX, deltaY);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
