import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Polynomial, parsePolynomial, PRESET_POLYNOMIALS, COLOR_OPTIONS } from '@/lib/polynomial';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EquationPanelProps {
  polynomials: Polynomial[];
  onAdd: (expression: string) => void;
  onRemove: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onUpdate: (id: string, expression: string) => void;
  onColorChange: (id: string, color: string) => void;
}

export function EquationPanel({ 
  polynomials, 
  onAdd, 
  onRemove, 
  onToggleVisibility,
  onUpdate,
  onColorChange,
}: EquationPanelProps) {
  const [newExpression, setNewExpression] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!newExpression.trim()) return;
    
    const coeffs = parsePolynomial(newExpression);
    if (!coeffs) {
      setError('Invalid polynomial');
      return;
    }
    
    setError('');
    onAdd(newExpression);
    setNewExpression('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="text-sm font-medium text-muted-foreground">
        Equations
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newExpression}
            onChange={(e) => {
              setNewExpression(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="x^2 + 2x - 3"
            className="graph-input flex-1"
          />
          <Button
            onClick={handleAdd}
            size="icon"
            variant="outline"
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {error && (
          <p className="text-destructive text-xs font-mono">{error}</p>
        )}
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Presets</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_POLYNOMIALS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onAdd(preset.expression)}
              className="px-2 py-1 text-xs font-mono bg-secondary hover:bg-accent 
                       rounded border border-border transition-colors"
            >
              {preset.expression}
            </button>
          ))}
        </div>
      </div>

      {/* Polynomial List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {polynomials.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-8">
            Add an equation to start
          </div>
        ) : (
          polynomials.map((poly) => (
            <div key={poly.id} className="equation-row group">
              {/* Color picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="w-4 h-4 rounded-full shrink-0 border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: poly.color }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="grid grid-cols-4 gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => onColorChange(poly.id, c.value)}
                        className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground font-mono text-sm">y =</span>
              
              <input
                type="text"
                value={poly.expression}
                onChange={(e) => onUpdate(poly.id, e.target.value)}
                className="flex-1 bg-transparent border-none outline-none font-mono text-sm min-w-0"
              />
              
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onToggleVisibility(poly.id)}
                  className="p-1.5 hover:bg-accent rounded transition-colors"
                >
                  {poly.visible ? (
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => onRemove(poly.id)}
                  className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help */}
      <div className="text-xs text-muted-foreground border-t border-border pt-3 space-y-1">
        <p>Syntax: <code className="text-foreground">ax^n + bx + c</code></p>
        <p>Drag to pan · Scroll to zoom</p>
      </div>
    </div>
  );
}
