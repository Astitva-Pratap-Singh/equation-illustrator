export interface Polynomial {
id: string;
expression: string;
coefficients: number[];
color: string;
visible: boolean;
}

export const GRAPH_COLORS = [
‘#000000’,  // black
‘#2563eb’,  // blue
‘#dc2626’,  // red
‘#16a34a’,  // green
‘#9333ea’,  // purple
‘#ea580c’,  // orange
];

export const COLOR_OPTIONS = [
{ name: ‘Black’, value: ‘#000000’ },
{ name: ‘Blue’, value: ‘#2563eb’ },
{ name: ‘Red’, value: ‘#dc2626’ },
{ name: ‘Green’, value: ‘#16a34a’ },
{ name: ‘Purple’, value: ‘#9333ea’ },
{ name: ‘Orange’, value: ‘#ea580c’ },
{ name: ‘Pink’, value: ‘#db2777’ },
{ name: ‘Teal’, value: ‘#0d9488’ },
];

// ============================================================================
// POLYNOMIAL OPERATIONS
// ============================================================================

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

for (let i = 0; i < p1.length; i++) {
result[i] += p1[i];
}
for (let i = 0; i < p2.length; i++) {
result[i] += p2[i];
}

return result;
}

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

function dividePolynomialByScalar(p: number[], scalar: number): number[] | null {
if (scalar === 0) return null;
return p.map(coeff => coeff / scalar);
}

function powerPolynomial(p: number[], n: number): number[] {
if (n === 0) return [1];
if (n === 1) return […p];
if (n < 0 || n > 50) return [NaN]; // Safety limit

let result = […p];
for (let i = 1; i < n; i++) {
result = multiplyPolynomials(result, p);
}
return result;
}

// ============================================================================
// ENHANCED PARSER WITH AST
// ============================================================================

interface ASTNode {
type: ‘number’ | ‘variable’ | ‘unary’ | ‘binop’ | ‘power’;
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
this.expr = expression.replace(/\s+/g, ‘’).toLowerCase();
this.pos = 0;
this.normalizeExpression();
}

private normalizeExpression(): void {
// Add explicit multiplication operators where needed
this.expr = this.expr
.replace(/(\d)(()/g, ‘$1*(’)           // 2(x) → 2*(x)
.replace(/())(()/g, ‘)*(’)            // )( → )*(
.replace(/())(\d)/g, ‘)*$2’)           // )2 → )*2
.replace(/(\d)(x)/g, ’$1*$2’)           // 2x → 2*x
.replace(/())(x)/g, ‘)*$2’)            // )x → )*x
.replace(/(x)(()/g, ’$1*(’)            // x( → x*(
.replace(/(x)(\d)/g, ‘$1*$2’);          // x2 → x*2
}

parse(): ASTNode | null {
try {
const ast = this.parseExpression();
if (this.pos < this.expr.length) {
throw new Error(`Unexpected character at position ${this.pos}: '${this.expr[this.pos]}'`);
}
return ast;
} catch (error) {
console.error(‘Parse error:’, error);
return null;
}
}

// Expression: handles + and - (lowest precedence)
private parseExpression(): ASTNode {
let left = this.parseTerm();

```
while (this.pos < this.expr.length) {
  const char = this.peek();
  if (char !== '+' && char !== '-') break;
  
  const op = this.consume();
  const right = this.parseTerm();
  left = { type: 'binop', op, left, right };
}

return left;
```

}

// Term: handles * and / (medium precedence)
private parseTerm(): ASTNode {
let left = this.parseFactor();

```
while (this.pos < this.expr.length) {
  const char = this.peek();
  if (char !== '*' && char !== '/') break;
  
  const op = this.consume();
  const right = this.parseFactor();
  left = { type: 'binop', op, left, right };
}

return left;
```

}

// Factor: handles ^ (highest precedence)
private parseFactor(): ASTNode {
let base = this.parsePrimary();

```
if (this.pos < this.expr.length && this.peek() === '^') {
  this.consume(); // consume '^'
  const exponent = this.parseFactor(); // Right associative
  base = { type: 'power', base, exponent };
}

return base;
```

}

// Primary: handles numbers, variables, parentheses, and unary minus
private parsePrimary(): ASTNode {
// Skip whitespace (shouldn’t exist after normalization, but just in case)
while (this.pos < this.expr.length && this.expr[this.pos] === ’ ’) {
this.pos++;
}

```
// Handle parentheses
if (this.peek() === '(') {
  this.consume(); // consume '('
  const expr = this.parseExpression();
  if (this.peek() !== ')') {
    throw new Error(`Expected ')' at position ${this.pos}`);
  }
  this.consume(); // consume ')'
  return expr;
}

// Handle unary minus
if (this.peek() === '-') {
  this.consume(); // consume '-'
  const operand = this.parsePrimary();
  return { type: 'unary', op: '-', operand };
}

// Handle unary plus (just ignore it)
if (this.peek() === '+') {
  this.consume(); // consume '+'
  return this.parsePrimary();
}

// Handle variable 'x'
if (this.peek() === 'x') {
  this.consume(); // consume 'x'
  return { type: 'variable' };
}

// Handle number
return this.parseNumber();
```

}

private parseNumber(): ASTNode {
let numStr = ‘’;
let hasDecimal = false;

```
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
  throw new Error(`Expected number at position ${this.pos}`);
}

const value = parseFloat(numStr);
if (!Number.isFinite(value)) {
  throw new Error(`Invalid number: ${numStr}`);
}

return { type: 'number', value };
```

}

private peek(): string {
return this.expr[this.pos] || ‘’;
}

private consume(): string {
return this.expr[this.pos++] || ‘’;
}
}

// Evaluate AST to polynomial coefficients
function evaluateAST(node: ASTNode | null): number[] | null {
if (!node) return null;

switch (node.type) {
case ‘number’:
return [node.value!];

```
case 'variable':
  return [0, 1]; // x = 0 + 1*x

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
    case '+':
      return addPolynomials(left, right);
    case '-':
      return subtractPolynomials(left, right);
    case '*':
      return multiplyPolynomials(left, right);
    case '/':
      // Only allow division by constants
      if (right.length === 1 && right[0] !== 0) {
        return dividePolynomialByScalar(left, right[0]);
      }
      console.error('Cannot divide by non-constant polynomial');
      return null;
    default:
      return null;
  }
}

case 'power': {
  const base = evaluateAST(node.base!);
  const exponent = evaluateAST(node.exponent!);
  
  if (!base || !exponent) return null;
  
  // Exponent must be a constant non-negative integer
  if (exponent.length !== 1) {
    console.error('Exponent must be a constant');
    return null;
  }
  
  const exp = Math.round(exponent[0]);
  if (exp < 0 || exp > 50) {
    console.error('Exponent out of range (0-50)');
    return null;
  }
  
  return powerPolynomial(base, exp);
}

default:
  return null;
```

}
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

export function parsePolynomial(expression: string): number[] | null {
try {
if (!expression || !expression.trim()) return null;

```
const parser = new PolynomialParser(expression);
const ast = parser.parse();

if (!ast) return null;

const coefficients = evaluateAST(ast);

if (!coefficients) return null;

// Validate all coefficients are finite
if (coefficients.some(c => !Number.isFinite(c))) {
  console.error('Invalid coefficients detected');
  return null;
}

// Remove trailing zeros (but keep at least [0] for zero polynomial)
while (coefficients.length > 1 && Math.abs(coefficients[coefficients.length - 1]) < 1e-10) {
  coefficients.pop();
}

return coefficients;
```

} catch (error) {
console.error(‘Error parsing polynomial:’, error);
return null;
}
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function evaluatePolynomial(coefficients: number[], x: number): number {
if (!coefficients || coefficients.length === 0) return 0;

// Horner’s method for efficient and numerically stable evaluation
let result = coefficients[coefficients.length - 1];
for (let i = coefficients.length - 2; i >= 0; i–) {
result = result * x + coefficients[i];
}

return result;
}

export function getDegree(coefficients: number[]): number {
if (!coefficients || coefficients.length === 0) return 0;

for (let i = coefficients.length - 1; i >= 0; i–) {
if (Math.abs(coefficients[i]) > 1e-10) return i;
}
return 0;
}

export function formatPolynomial(coefficients: number[]): string {
if (!coefficients || coefficients.length === 0) return ‘0’;

const terms: string[] = [];

for (let i = coefficients.length - 1; i >= 0; i–) {
const coeff = coefficients[i];
if (Math.abs(coeff) < 1e-10) continue;

```
const sign = coeff > 0 ? '+' : '-';
const absCoeff = Math.abs(coeff);
const roundedCoeff = Math.round(absCoeff * 10000) / 10000;

let term = '';

if (i === 0) {
  // Constant term
  term = `${sign} ${roundedCoeff}`;
} else if (i === 1) {
  // Linear term
  if (Math.abs(roundedCoeff - 1) < 1e-10) {
    term = `${sign} x`;
  } else {
    term = `${sign} ${roundedCoeff}x`;
  }
} else {
  // Higher degree terms
  if (Math.abs(roundedCoeff - 1) < 1e-10) {
    term = `${sign} x^${i}`;
  } else {
    term = `${sign} ${roundedCoeff}x^${i}`;
  }
}

terms.push(term);
```

}

if (terms.length === 0) return ‘0’;

let result = terms.join(’ ‘);
if (result.startsWith(’+ ’)) {
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

export function getIntegral(coefficients: number[], constant: number = 0): number[] {
if (!coefficients || coefficients.length === 0) return [constant];

const result = new Array(coefficients.length + 1);
result[0] = constant;

for (let i = 0; i < coefficients.length; i++) {
result[i + 1] = coefficients[i] / (i + 1);
}

return result;
}

export function findRoots(coefficients: number[]): number[] {
if (!coefficients || coefficients.length === 0) return [];

const degree = getDegree(coefficients);

// Linear: ax + b = 0 → x = -b/a
if (degree === 1) {
const [b, a] = coefficients;
if (Math.abs(a) > 1e-10) {
return [-b / a];
}
return [];
}

// Quadratic: ax² + bx + c = 0
if (degree === 2) {
const [c, b, a] = coefficients;
const discriminant = b * b - 4 * a * c;

```
if (discriminant >= 0) {
  const sqrtDisc = Math.sqrt(discriminant);
  const root1 = (-b + sqrtDisc) / (2 * a);
  const root2 = (-b - sqrtDisc) / (2 * a);
  return Math.abs(root1 - root2) < 1e-10 ? [root1] : [root1, root2];
}
return []; // Complex roots
```

}

// For higher degrees, numerical approximation would be needed
// This is a basic implementation
return [];
}

export const PRESET_POLYNOMIALS = [
{ name: ‘Linear’, expression: ‘x’, description: ‘Simple line’ },
{ name: ‘Quadratic’, expression: ‘x^2’, description: ‘Basic parabola’ },
{ name: ‘Cubic’, expression: ‘x^3’, description: ‘Basic cubic’ },
{ name: ‘Parabola’, expression: ‘x^2 - 4’, description: ‘Shifted parabola’ },
{ name: ‘S-curve’, expression: ‘x^3 - 3*x’, description: ‘Cubic with inflection’ },
{ name: ‘Quartic’, expression: ’x^4 - 5*x^2 + 4’, description: ‘Fourth degree’ },
{ name: ‘(x+1)(x-2)’, expression: ‘(x+1)*(x-2)’, description: ‘Product of linear factors’ },
{ name: ‘(x+2)(x-1)(x-3)’, expression: ’(x+2)*(x-1)*(x-3)’, description: ‘Three factor product’ },
{ name: ‘(x+1)^2’, expression: ‘(x+1)^2’, description: ‘Perfect square’ },
{ name: ‘(x-2)^3’, expression: ‘(x-2)^3’, description: ‘Perfect cube’ },
{ name: ‘(x^2+1)(x-1)’, expression: ’(x^2+1)*(x-1)’, description: ‘Mixed degree product’ },
{ name: ‘(x+1)^2*(x-1)’, expression: ‘(x+1)^2*(x-1)’, description: ‘Complex factorization’ },
{ name: ‘x(x-1)(x-2)(x-3)’, expression: ‘x*(x-1)*(x-2)*(x-3)’, description: ‘Quartic with 4 roots’ },
];