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

// Helper: Divide polynomial by scalar
function dividePolynomialByScalar(p: number[], scalar: number): number[] | null {
  if (scalar === 0) return null;
  return p.map(coeff => coeff / scalar);
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

// Parse a basic polynomial (no operations, just terms)
function parseBasicPolynomial(expression: string): number[] | null {
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
        const parsed = parseFloat(coeffPart.replace('*', ''));
        coefficient = isNaN(parsed) ? 1 : parsed;
      }
      
      // Parse power
      let power = 1;
      if (powerPart && powerPart.startsWith('^')) {
        const parsed = parseInt(powerPart.substring(1));
        power = isNaN(parsed) ? 1 : parsed;
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

// Tokenize expression into components
interface Token {
  type: 'poly' | 'op' | 'lparen' | 'rparen' | 'power';
  value: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < expr.length) {
    const char = expr[i];
    
    if (char === '(') {
      tokens.push({ type: 'lparen', value: '(' });
      i++;
    } else if (char === ')') {
      tokens.push({ type: 'rparen', value: ')' });
      i++;
    } else if (char === '+') {
      tokens.push({ type: 'op', value: '+' });
      i++;
    } else if (char === '-') {
      // Check if it's a negative sign or subtraction
      if (i === 0 || expr[i-1] === '(' || expr[i-1] === '+' || expr[i-1] === '-' || expr[i-1] === '*' || expr[i-1] === '/') {
        // It's a negative sign, include it in the next polynomial
        let j = i + 1;
        while (j < expr.length && expr[j] !== '+' && expr[j] !== '-' && expr[j] !== '*' && expr[j] !== '/' && expr[j] !== '(' && expr[j] !== ')' && expr[j] !== '^') {
          j++;
        }
        tokens.push({ type: 'poly', value: expr.substring(i, j) });
        i = j;
      } else {
        tokens.push({ type: 'op', value: '-' });
        i++;
      }
    } else if (char === '*') {
      tokens.push({ type: 'op', value: '*' });
      i++;
    } else if (char === '/') {
      tokens.push({ type: 'op', value: '/' });
      i++;
    } else if (char === '^') {
      tokens.push({ type: 'power', value: '^' });
      i++;
    } else if (char !== ' ') {
      // Read polynomial term
      let j = i;
      while (j < expr.length && expr[j] !== '+' && expr[j] !== '-' && expr[j] !== '*' && expr[j] !== '/' && expr[j] !== '(' && expr[j] !== ')' && expr[j] !== '^' && expr[j] !== ' ') {
        j++;
      }
      if (j > i) {
        tokens.push({ type: 'poly', value: expr.substring(i, j) });
        i = j;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  
  return tokens;
}

// Parse expression with proper operator precedence
function parseExpression(tokens: Token[], start: number = 0, end?: number): { result: number[] | null, endIndex: number } {
  if (end === undefined) end = tokens.length;
  
  // Handle parentheses and build expression tree
  let i = start;
  const values: number[][] = [];
  const operators: string[] = [];
  
  while (i < end) {
    const token = tokens[i];
    
    if (token.type === 'lparen') {
      // Find matching closing parenthesis
      let depth = 1;
      let j = i + 1;
      while (j < end && depth > 0) {
        if (tokens[j].type === 'lparen') depth++;
        if (tokens[j].type === 'rparen') depth--;
        j++;
      }
      
      // Parse the content inside parentheses
      const inner = parseExpression(tokens, i + 1, j - 1);
      if (inner.result) {
        // Check for power after parenthesis
        if (j < end && tokens[j]?.type === 'power' && j + 1 < end && tokens[j + 1]?.type === 'poly') {
          const power = parseInt(tokens[j + 1].value);
          if (!isNaN(power)) {
            values.push(powerPolynomial(inner.result, power));
            i = j + 2;
            continue;
          }
        }
        values.push(inner.result);
      }
      i = j;
    } else if (token.type === 'poly') {
      const poly = parseBasicPolynomial(token.value);
      if (poly) {
        values.push(poly);
      }
      i++;
    } else if (token.type === 'op') {
      operators.push(token.value);
      i++;
    } else {
      i++;
    }
  }
  
  if (values.length === 0) return { result: null, endIndex: end };
  
  // Apply operators with precedence (*, / before +, -)
  // First pass: handle * and /
  let j = 0;
  while (j < operators.length) {
    if (operators[j] === '*') {
      const result = multiplyPolynomials(values[j], values[j + 1]);
      values.splice(j, 2, result);
      operators.splice(j, 1);
    } else if (operators[j] === '/') {
      // Division: divide by a constant only
      const divisor = values[j + 1];
      if (divisor.length === 1) {
        const result = dividePolynomialByScalar(values[j], divisor[0]);
        if (result) {
          values.splice(j, 2, result);
          operators.splice(j, 1);
        } else {
          j++;
        }
      } else {
        // Can't divide by non-constant polynomial
        j++;
      }
    } else {
      j++;
    }
  }
  
  // Second pass: handle + and -
  let result = values[0];
  j = 0;
  while (j < operators.length) {
    if (operators[j] === '+') {
      result = addPolynomials(result, values[j + 1]);
    } else if (operators[j] === '-') {
      result = subtractPolynomials(result, values[j + 1]);
    }
    j++;
  }
  
  return { result, endIndex: end };
}

// Main parser
export function parsePolynomial(expression: string): number[] | null {
  try {
    let cleaned = expression.replace(/\s/g, '').toLowerCase();
    
    if (!cleaned) return null;
    
    // Tokenize the expression
    const tokens = tokenize(cleaned);
    
    if (tokens.length === 0) return null;
    
    // Parse the expression
    const parsed = parseExpression(tokens);
    
    return parsed.result;
    
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
    if (Math.abs(coeff) < 1e-10) continue; // Skip near-zero coefficients
    
    let term = '';
    const absCoeff = Math.abs(coeff);
    const sign = coeff > 0 ? '+' : '-';
    
    // Round to avoid floating point errors
    const roundedCoeff = Math.round(absCoeff * 1000) / 1000;
    
    if (i === 0) {
      term = `${sign} ${roundedCoeff}`;
    } else if (i === 1) {
      if (Math.abs(roundedCoeff - 1) < 1e-10) {
        term = `${sign} x`;
      } else {
        term = `${sign} ${roundedCoeff}x`;
      }
    } else {
      if (Math.abs(roundedCoeff - 1) < 1e-10) {
        term = `${sign} x^${i}`;
      } else {
        term = `${sign} ${roundedCoeff}x^${i}`;
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
  { name: '(x+1)(x-2)', expression: '(x+1)*(x-2)' },
  { name: '(x+2)(x-1)(x-3)', expression: '(x+2)*(x-1)*(x-3)' },
  { name: '(x+1)^2', expression: '(x+1)^2' },
  { name: '(x-2)^3', expression: '(x-2)^3' },
  { name: '(x^2+1)(x-1)', expression: '(x^2+1)*(x-1)' },
  { name: '(x+1)^2*(x-1)', expression: '(x+1)^2*(x-1)' },
  { name: 'x(x-1)(x-2)(x-3)', expression: 'x*(x-1)*(x-2)*(x-3)' },
];