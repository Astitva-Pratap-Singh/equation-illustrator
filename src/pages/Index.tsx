import { useState, useCallback, useEffect } from 'react';
import { GraphCanvas } from '@/components/GraphCanvas';
import { EquationPanel } from '@/components/EquationPanel';
import { ZoomControls } from '@/components/ZoomControls';
import { Polynomial, parsePolynomial, GRAPH_COLORS } from '@/lib/polynomial';
import { Sun, Moon } from 'lucide-react';

const Index = () => {
  const [polynomials, setPolynomials] = useState<Polynomial[]>([
    {
      id: '1',
      expression: 'x^2',
      coefficients: [0, 0, 1],
      color: GRAPH_COLORS[0],
      visible: true,
    },
  ]);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleAddPolynomial = useCallback((expression: string) => {
    const coefficients = parsePolynomial(expression);
    if (!coefficients) return;

    const newPoly: Polynomial = {
      id: Date.now().toString(),
      expression,
      coefficients,
      color: GRAPH_COLORS[polynomials.length % GRAPH_COLORS.length],
      visible: true,
    };

    setPolynomials((prev) => [...prev, newPoly]);
  }, [polynomials.length]);

  const handleRemovePolynomial = useCallback((id: string) => {
    setPolynomials((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleToggleVisibility = useCallback((id: string) => {
    setPolynomials((prev) =>
      prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p))
    );
  }, []);

  const handleUpdatePolynomial = useCallback((id: string, expression: string) => {
    const coefficients = parsePolynomial(expression);
    
    setPolynomials((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, expression, coefficients: coefficients || p.coefficients }
          : p
      )
    );
  }, []);

  const handleColorChange = useCallback((id: string, color: string) => {
    setPolynomials((prev) =>
      prev.map((p) => (p.id === id ? { ...p, color } : p))
    );
  }, []);

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setPanX((prev) => prev + deltaX);
    setPanY((prev) => prev + deltaY);
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.2));
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev * 1.1, 5));
    } else {
      setZoom((prev) => Math.max(prev / 1.1, 0.2));
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background font-mono text-sm font-semibold">ƒ</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Equation illustrator</h1>
          </div>
        </div>
        
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Equation Panel */}
        <aside className="w-72 border-r border-border p-4 flex-shrink-0">
          <EquationPanel
            polynomials={polynomials}
            onAdd={handleAddPolynomial}
            onRemove={handleRemovePolynomial}
            onToggleVisibility={handleToggleVisibility}
            onUpdate={handleUpdatePolynomial}
            onColorChange={handleColorChange}
          />
        </aside>

        {/* Graph Area */}
        <main className="flex-1 relative" onWheel={handleWheel}>
          <GraphCanvas
            polynomials={polynomials}
            zoom={zoom}
            panX={panX}
            panY={panY}
            onPan={handlePan}
            isDark={isDark}
          />
          <ZoomControls
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
