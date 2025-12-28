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

// Helper: Multiply two polynomials
function multiplyPolynomials(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] += p1[i] * p2[j];
    }
  }
  
  return result;
}

// Helper: Add two polynomials
function addPolynomials(p1: number[], p2: number[]): number[] {
  const maxLen = Math.max(p1.length, p2.length);
  const result = new Array(maxLen).fill(0);
  
  for (let i = 0; i < p1.length; i++) {
    result[i] += p1[i];
  }
  for (let i = 0; i < p2.length; i++) {
    result[i] += p2[i];
  }
  
  return result;
}

// Helper: Subtract two polynomials
function subtractPolynomials(p1: number[], p2: number[]): number[] {
  const maxLen = Math.max(p1.length, p2.length);
  const result = new Array(maxLen).fill(0);
  
  for (let i = 0; i < p1.length; i++) {
    result[i] += p1[i];
  }
  for (let i = 0; i < p2.length; i++) {
    result[i] -= p2[i];
  }
  
  return result;
}

// Helper: Raise polynomial to a power
function powerPolynomial(p: number[], n: number): number[] {
  if (n === 0) return [1];
  if (n === 1) return [...p];
  
  let result = [...p];
  for (let i = 1; i < n; i++) {
    result = multiplyPolynomials(result, p);
  }
  return result;
}

// Parse a simple polynomial term or expression in parentheses
function parseSimpleExpression(expr: string): number[] | null {
  expr = expr.trim();
  
  // Check if it's a parenthesized expression
  if (expr.startsWith('(') && expr.endsWith(')')) {
    return parsePolynomial(expr.substring(1, expr.length - 1));
  }
  
  // Parse as a simple polynomial
  return parseSimplePolynomial(expr);
}

// Parse polynomial without multiplication/division operations
function parseSimplePolynomial(expression: string): number[] | null {
  let cleaned = expression.replace(/\s/g, '').toLowerCase();
  
  if (!cleaned) return null;
  
  // Handle implicit multiplication (2x, 3x^2, etc.)
  cleaned = cleaned.replace(/(\d)(x)/g, '$1*$2');
  
  const coefficients: Map<number, number> = new Map();
  
  // Split by + and -, keeping the signs
  cleaned = cleaned.replace(/-/g, '+-');
  const terms = cleaned.split('+').filter(t => t !== '');
  
  for (const term of terms) {
    if (term === '') continue;
    
    if (term.includes('x')) {
      let [coeffPart, powerPart] = term.split('x');
      
      // Parse coefficient
      let coefficient = 1;
      if (coeffPart === '' || coeffPart === '+') {
        coefficient = 1;
      } else if (coeffPart === '-') {
        coefficient = -1;
      } else {
        coefficient = parseFloat(coeffPart.replace('*', ''));
        if (isNaN(coefficient)) coefficient = 1;
      }
      
      // Parse power
      let power = 1;
      if (powerPart && powerPart.startsWith('^')) {
        power = parseInt(powerPart.substring(1));
        if (isNaN(power)) power = 1;
      }
      
      const current = coefficients.get(power) || 0;
      coefficients.set(power, current + coefficient);
    } else {
      // Constant term
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

// Main parser with support for multiplication, division, and powers
export function parsePolynomial(expression: string): number[] | null {
  try {
    let cleaned = expression.replace(/\s/g, '').toLowerCase();
    
    if (!cleaned) return null;
    
    // Handle parentheses with multiplication: (x+1)(x-2)
    // First, find all balanced parentheses groups
    const parenGroups: string[] = [];
    let depth = 0;
    let start = -1;
    
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '(') {
        if (depth === 0) start = i;
        depth++;
      } else if (cleaned[i] === ')') {
        depth--;
        if (depth === 0 && start !== -1) {
          parenGroups.push(cleaned.substring(start, i + 1));
        }
      }
    }
    
    // If we have multiplication of parenthesized expressions
    if (parenGroups.length > 0) {
      // Check for patterns like (...)(...) or (...)^n
      let workingExpr = cleaned;
      const groupMap = new Map<string, number[]>();
      
      // Parse each group
      for (const group of parenGroups) {
        const inner = group.substring(1, group.length - 1);
        const parsed = parseSimplePolynomial(inner);
        if (parsed) {
          groupMap.set(group, parsed);
        }
      }
      
      // Handle powers: (x+1)^2
      workingExpr = workingExpr.replace(/\(([^)]+)\)\^(\d+)/g, (match, inner, power) => {
        const p = parseSimplePolynomial(inner);
        if (p) {
          const powered = powerPolynomial(p, parseInt(power));
          const key = `__P${groupMap.size}__`;
          groupMap.set(key, powered);
          return key;
        }
        return match;
      });
      
      // Replace remaining groups with keys
      for (const group of parenGroups) {
        if (groupMap.has(group)) {
          const key = `__G${Array.from(groupMap.keys()).indexOf(group)}__`;
          workingExpr = workingExpr.replace(group, key);
          groupMap.set(key, groupMap.get(group)!);
        }
      }
      
      // Now handle multiplication
      // Pattern: __Gn__*__Gm__ or __Gn____Gm__ (implicit)
      workingExpr = workingExpr.replace(/(__[GP]\d+__)(__[GP]\d+__)/g, '$1*$2');
      
      const multPattern = /(__[GP]\d+__)\*(__[GP]\d+__)/;
      while (multPattern.test(workingExpr)) {
        workingExpr = workingExpr.replace(multPattern, (match, g1, g2) => {
          const p1 = groupMap.get(g1);
          const p2 = groupMap.get(g2);
          if (p1 && p2) {
            const result = multiplyPolynomials(p1, p2);
            const key = `__R${groupMap.size}__`;
            groupMap.set(key, result);
            return key;
          }
          return match;
        });
      }
      
      // Handle addition/subtraction with groups
      const finalKey = Array.from(groupMap.keys()).find(k => workingExpr.includes(k));
      if (finalKey && groupMap.has(finalKey)) {
        let result = groupMap.get(finalKey)!;
        
        // Handle any remaining additions or subtractions
        const remainingTerms = workingExpr.replace(finalKey, '').trim();
        if (remainingTerms) {
          const additional = parseSimplePolynomial(remainingTerms);
          if (additional) {
            result = addPolynomials(result, additional);
          }
        }
        
        return result;
      }
    }
    
    // If no special operations, parse as simple polynomial
    return parseSimplePolynomial(cleaned);
    
  } catch (error) {
    console.error('Error parsing polynomial:', error);
    return null;
  }
}

export function evaluatePolynomial(coefficients: number[], x: number): number {
  // Using Horner's method for better numerical stability
  if (coefficients.length === 0) return 0;
  
  let result = coefficients[coefficients.length - 1];
  for (let i = coefficients.length - 2; i >= 0; i--) {
    result = result * x + coefficients[i];
  }
  return result;
}

// Get polynomial degree
export function getDegree(coefficients: number[]): number {
  for (let i = coefficients.length - 1; i >= 0; i--) {
    if (coefficients[i] !== 0) return i;
  }
  return 0;
}

// Format polynomial as readable string
export function formatPolynomial(coefficients: number[]): string {
  const terms: string[] = [];
  
  for (let i = coefficients.length - 1; i >= 0; i--) {
    const coeff = coefficients[i];
    if (coeff === 0) continue;
    
    let term = '';
    const absCoeff = Math.abs(coeff);
    const sign = coeff > 0 ? '+' : '-';
    
    if (i === 0) {
      term = `${sign} ${absCoeff}`;
    } else if (i === 1) {
      if (absCoeff === 1) {
        term = `${sign} x`;
      } else {
        term = `${sign} ${absCoeff}x`;
      }
    } else {
      if (absCoeff === 1) {
        term = `${sign} x^${i}`;
      } else {
        term = `${sign} ${absCoeff}x^${i}`;
      }
    }
    
    terms.push(term);
  }
  
  if (terms.length === 0) return '0';
  
  let result = terms.join(' ');
  if (result.startsWith('+ ')) {
    result = result.substring(2);
  }
  
  return result;
}

// Calculate derivative
export function getDerivative(coefficients: number[]): number[] {
  if (coefficients.length <= 1) return [0];
  
  const result = new Array(coefficients.length - 1);
  for (let i = 1; i < coefficients.length; i++) {
    result[i - 1] = coefficients[i] * i;
  }
  
  return result;
}

export const PRESET_POLYNOMIALS = [
  { name: 'Linear', expression: 'x' },
  { name: 'Quadratic', expression: 'x^2' },
  { name: 'Cubic', expression: 'x^3' },
  { name: 'Parabola', expression: 'x^2 - 4' },
  { name: 'S-curve', expression: 'x^3 - 3x' },
  { name: 'Quartic', expression: 'x^4 - 5x^2 + 4' },
  { name: 'Product (x+1)(x-2)', expression: '(x+1)(x-2)' },
  { name: 'Product (x+2)(x-1)(x-3)', expression: '(x+2)(x-1)(x-3)' },
  { name: 'Square (x+1)^2', expression: '(x+1)^2' },
  { name: 'Cube (x-2)^3', expression: '(x-2)^3' },
  { name: 'Mixed (x+1)^2(x-1)', expression: '(x+1)^2(x-1)' },
];