export interface Polynomial {
  id: string;
  expression: string;
  coefficients: number[];
  color: string;
  visible: boolean;
}

export const GRAPH_COLORS = [
  '#000000',
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#ea580c',
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

function multiplyPolynomials(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] += p1[i] * p2[j];
    }
  }
  return result;
}

function addPolynomials(p1: number[], p2: number[]): number[] {
  const maxLen = Math.max(p1.length, p2.length);
  const result = new Array(maxLen).fill(0);
  for (let i = 0; i < p1.length; i++) result[i] += p1[i];
  for (let i = 0; i < p2.length; i++) result[i] += p2[i];
  return result;
}

function subtractPolynomials(p1: number[], p2: number[]): number[] {
  const maxLen = Math.max(p1.length, p2.length);
  const result = new Array(maxLen).fill(0);
  for (let i = 0; i < p1.length; i++) result[i] += p1[i];
  for (let i = 0; i < p2.length; i++) result[i] -= p2[i];
  return result;
}

function dividePolynomialByScalar(p: number[], scalar: number): number[] | null {
  if (scalar === 0) return null;
  return p.map(coeff => coeff / scalar);
}

function powerPolynomial(p: number[], n: number): number[] {
  if (n === 0) return [1];
  if (n === 1) return [...p];
  if (n < 0 || n > 50) return [NaN];
  let result = [...p];
  for (let i = 1; i < n; i++) {
    result = multiplyPolynomials(result, p);
  }
  return result;
}

interface ASTNode {
  type: 'number' | 'variable' | 'unary' | 'binop' | 'power';
  value?: number;
  op?: string;
  left?: ASTNode;
  right?: ASTNode;
  operand?: ASTNode;
  base?: ASTNode;
  exponent?: ASTNode;
}

class PolynomialParser {
  private expr: string;
  private pos: number;

  constructor(expression: string) {
    this.expr = expression.replace(/\s+/g, '').toLowerCase();
    this.pos = 0;
    this.normalizeExpression();
  }

  private normalizeExpression(): void {
    this.expr = this.expr
      .replace(/(\d)(\()/g, '$1*(')
      .replace(/(\))(\()/g, ')*(')
      .replace(/(\))(\d)/g, ')*$2')
      .replace(/(\d)(x)/g, '$1*$2')
      .replace(/(\))(x)/g, ')*$2')
      .replace(/(x)(\()/g, '$1*(')
      .replace(/(x)(\d)/g, '$1*$2');
  }

  parse(): ASTNode | null {
    try {
      const ast = this.parseExpression();
      if (this.pos < this.expr.length) {
        throw new Error('Unexpected character at position ' + this.pos);
      }
      return ast;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    while (this.pos < this.expr.length) {
      const char = this.peek();
      if (char !== '+' && char !== '-') break;
      const op = this.consume();
      const right = this.parseTerm();
      left = { type: 'binop', op, left, right };
    }
    return left;
  }

  private parseTerm(): ASTNode {
    let left = this.parseFactor();
    while (this.pos < this.expr.length) {
      const char = this.peek();
      if (char !== '*' && char !== '/') break;
      const op = this.consume();
      const right = this.parseFactor();
      left = { type: 'binop', op, left, right };
    }
    return left;
  }

  private parseFactor(): ASTNode {
    let base = this.parsePrimary();
    if (this.pos < this.expr.length && this.peek() === '^') {
      this.consume();
      const exponent = this.parseFactor();
      base = { type: 'power', base, exponent };
    }
    return base;
  }

  private parsePrimary(): ASTNode {
    if (this.peek() === '(') {
      this.consume();
      const expr = this.parseExpression();
      if (this.peek() !== ')') {
        throw new Error('Expected closing parenthesis');
      }
      this.consume();
      return expr;
    }
    if (this.peek() === '-') {
      this.consume();
      const operand = this.parsePrimary();
      return { type: 'unary', op: '-', operand };
    }
    if (this.peek() === '+') {
      this.consume();
      return this.parsePrimary();
    }
    if (this.peek() === 'x') {
      this.consume();
      return { type: 'variable' };
    }
    return this.parseNumber();
  }

  private parseNumber(): ASTNode {
    let numStr = '';
    let hasDecimal = false;
    while (this.pos < this.expr.length) {
      const char = this.peek();
      if (char >= '0' && char <= '9') {
        numStr += this.consume();
      } else if (char === '.' && !hasDecimal) {
        hasDecimal = true;
        numStr += this.consume();
      } else {
        break;
      }
    }
    if (numStr === '' || numStr === '.') {
      throw new Error('Expected number at position ' + this.pos);
    }
    const value = parseFloat(numStr);
    if (!Number.isFinite(value)) {
      throw new Error('Invalid number: ' + numStr);
    }
    return { type: 'number', value };
  }

  private peek(): string {
    return this.expr[this.pos] || '';
  }

  private consume(): string {
    return this.expr[this.pos++] || '';
  }
}

function evaluateAST(node: ASTNode | null): number[] | null {
  if (!node) return null;
  switch (node.type) {
    case 'number':
      return [node.value!];
    case 'variable':
      return [0, 1];
    case 'unary':
      if (node.op === '-') {
        const operand = evaluateAST(node.operand!);
        return operand ? operand.map(c => -c) : null;
      }
      return null;
    case 'binop': {
      const left = evaluateAST(node.left!);
      const right = evaluateAST(node.right!);
      if (!left || !right) return null;
      switch (node.op) {
        case '+': return addPolynomials(left, right);
        case '-': return subtractPolynomials(left, right);
        case '*': return multiplyPolynomials(left, right);
        case '/':
          if (right.length === 1 && right[0] !== 0) {
            return dividePolynomialByScalar(left, right[0]);
          }
          return null;
        default: return null;
      }
    }
    case 'power': {
      const base = evaluateAST(node.base!);
      const exponent = evaluateAST(node.exponent!);
      if (!base || !exponent || exponent.length !== 1) return null;
      const exp = Math.round(exponent[0]);
      if (exp < 0 || exp > 50) return null;
      return powerPolynomial(base, exp);
    }
    default: return null;
  }
}

export function parsePolynomial(expression: string): number[] | null {
  try {
    if (!expression || !expression.trim()) return null;
    const parser = new PolynomialParser(expression);
    const ast = parser.parse();
    if (!ast) return null;
    const coefficients = evaluateAST(ast);
    if (!coefficients) return null;
    if (coefficients.some(c => !Number.isFinite(c))) return null;
    while (coefficients.length > 1 && Math.abs(coefficients[coefficients.length - 1]) < 1e-10) {
      coefficients.pop();
    }
    return coefficients;
  } catch (error) {
    console.error('Error parsing polynomial:', error);
    return null;
  }
}

export function evaluatePolynomial(coefficients: number[], x: number): number {
  if (!coefficients || coefficients.length === 0) return 0;
  let result = coefficients[coefficients.length - 1];
  for (let i = coefficients.length - 2; i >= 0; i--) {
    result = result * x + coefficients[i];
  }
  return result;
}

export function getDegree(coefficients: number[]): number {
  if (!coefficients || coefficients.length === 0) return 0;
  for (let i = coefficients.length - 1; i >= 0; i--) {
    if (Math.abs(coefficients[i]) > 1e-10) return i;
  }
  return 0;
}

export function formatPolynomial(coefficients: number[]): string {
  if (!coefficients || coefficients.length === 0) return '0';
  const terms: string[] = [];
  for (let i = coefficients.length - 1; i >= 0; i--) {
    const coeff = coefficients[i];
    if (Math.abs(coeff) < 1e-10) continue;
    const sign = coeff > 0 ? '+' : '-';
    const absCoeff = Math.abs(coeff);
    const roundedCoeff = Math.round(absCoeff * 10000) / 10000;
    let term = '';
    if (i === 0) {
      term = sign + ' ' + roundedCoeff;
    } else if (i === 1) {
      if (Math.abs(roundedCoeff - 1) < 1e-10) {
        term = sign + ' x';
      } else {
        term = sign + ' ' + roundedCoeff + 'x';
      }
    } else {
      if (Math.abs(roundedCoeff - 1) < 1e-10) {
        term = sign + ' x^' + i;
      } else {
        term = sign + ' ' + roundedCoeff + 'x^' + i;
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

export function getDerivative(coefficients: number[]): number[] {
  if (!coefficients || coefficients.length <= 1) return [0];
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
  { name: 'S-curve', expression: 'x^3 - 3*x' },
  { name: 'Quartic', expression: 'x^4 - 5*x^2 + 4' },
  { name: '(x+1)(x-2)', expression: '(x+1)*(x-2)' },
  { name: '(x+2)(x-1)(x-3)', expression: '(x+2)*(x-1)*(x-3)' },
  { name: '(x+1)^2', expression: '(x+1)^2' },
  { name: '(x-2)^3', expression: '(x-2)^3' },
  { name: '(x^2+1)(x-1)', expression: '(x^2+1)*(x-1)' },
  { name: '(x+1)^2*(x-1)', expression: '(x+1)^2*(x-1)' },
  { name: 'x(x-1)(x-2)(x-3)', expression: 'x*(x-1)*(x-2)*(x-3)' },
];
