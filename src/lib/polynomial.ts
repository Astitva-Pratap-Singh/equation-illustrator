export interface Polynomial {
  id: string;
  expression: string;
  coefficients: number[];
  color: string;
  visible: boolean;
}

export const GRAPH_COLORS = [
  '#000000',  // black
  '#2563eb',  // blue
  '#dc2626',  // red
  '#16a34a',  // green
  '#9333ea',  // purple
  '#ea580c',  // orange
];

export const COLOR_OPTIONS = [
  { name: 'Black', value: '#000000' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Teal', value: '#0d9488' },
];

export function parsePolynomial(expression: string): number[] | null {
  let cleaned = expression.replace(/\s/g, '').toLowerCase();
  
  if (!cleaned) return null;
  
  cleaned = cleaned.replace(/(\d)(x)/g, '$1*$2');
  
  const coefficients: Map<number, number> = new Map();
  
  cleaned = cleaned.replace(/-/g, '+-');
  const terms = cleaned.split('+').filter(t => t !== '');
  
  for (const term of terms) {
    if (term === '') continue;
    
    if (term.includes('x')) {
      let [coeffPart, powerPart] = term.split('x');
      
      let coefficient = 1;
      if (coeffPart === '' || coeffPart === '+') {
        coefficient = 1;
      } else if (coeffPart === '-') {
        coefficient = -1;
      } else {
        coefficient = parseFloat(coeffPart.replace('*', ''));
        if (isNaN(coefficient)) coefficient = 1;
      }
      
      let power = 1;
      if (powerPart && powerPart.startsWith('^')) {
        power = parseInt(powerPart.substring(1));
        if (isNaN(power)) power = 1;
      }
      
      const current = coefficients.get(power) || 0;
      coefficients.set(power, current + coefficient);
    } else {
      const value = parseFloat(term);
      if (!isNaN(value)) {
        const current = coefficients.get(0) || 0;
        coefficients.set(0, current + value);
      }
    }
  }
  
  if (coefficients.size === 0) return null;
  
  const maxPower = Math.max(...coefficients.keys(), 0);
  const result: number[] = new Array(maxPower + 1).fill(0);
  
  coefficients.forEach((coeff, power) => {
    result[power] = coeff;
  });
  
  return result;
}

export function evaluatePolynomial(coefficients: number[], x: number): number {
  let result = 0;
  for (let i = 0; i < coefficients.length; i++) {
    result += coefficients[i] * Math.pow(x, i);
  }
  return result;
}

export const PRESET_POLYNOMIALS = [
  { name: 'Quadratic', expression: 'x^2' },
  { name: 'Cubic', expression: 'x^3' },
  { name: 'Parabola', expression: 'x^2 - 4' },
  { name: 'S-curve', expression: 'x^3 - 3x' },
  { name: 'Quartic', expression: 'x^4 - 5x^2 + 4' },
];
