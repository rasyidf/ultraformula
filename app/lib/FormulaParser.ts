import type { ParameterMetadata } from "~/types/Formula";

type Token = {
  type: 'number' | 'operator' | 'function' | 'variable' | 'parenthesis';
  value: string;
};

export class FormulaParser {
  private static readonly ALLOWED_FUNCTIONS = new Set([
    'sin', 'cos', 'tan', 'abs', 'sqrt', 'pow', 'exp', 'log',
    'floor', 'ceil', 'round', 'min', 'max',
    'atan', 'atan2', 'sinh', 'cosh', 'tanh', 'asin', 'acos', 'acosh', 'asinh', 'atanh', 'sign', 'trunc', 'clamp'
  ]);

  // Built-in constants
  private static readonly BUILTIN_CONSTANTS: Record<string, number> = {
    PI: Math.PI,
    E: Math.E,
    TAU: Math.PI * 2,
    PHI: (1 + Math.sqrt(5)) / 2,
  };

  private static readonly OPERATORS = new Set(['+', '-', '*', '/', '^', '(', ')']);
  private static readonly SCIENTIFIC_NOTATION_REGEX = /^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/;

  static detectParameters(formula: string): ParameterMetadata[] {
    const tokens = this.tokenize(formula.slice(1));
    return tokens
      .filter(token => token.type === 'variable')
      .map(token => ({ name: token.value, min: 0, max: 100 })); // Default min/max values
  }

  static validateFormula(formula: string): boolean {
    if (!formula.startsWith('=')) {
      return false;
    }
    const tokens = this.tokenize(formula.slice(1));
    return this.validateTokens(tokens);
  }

  static tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let current = '';
    let i = 0;

    while (i < formula.length) {
      const char = formula[i];

      if (char === ' ') {
        i++;
        continue;
      }

      // Handle scientific notation (e.g., 1.23e-4)
      if ((char === 'e' || char === 'E') && current && /\d$/.test(current)) {
        current += char;
        i++;
        // Accept optional sign after 'e'
        if (i < formula.length && (formula[i] === '-' || formula[i] === '+')) {
          current += formula[i];
          i++;
        }
        // Accept digits after 'e' or 'E'
        while (i < formula.length && /\d/.test(formula[i])) {
          current += formula[i];
          i++;
        }
        continue;
      }

      // Handle negative numbers at start or after operator/parenthesis
      if ((char === '-' || char === '+') && (i === 0 || this.OPERATORS.has(formula[i - 1]) || formula[i - 1] === '(')) {
        current += char;
        i++;
        continue;
      }

      if (this.OPERATORS.has(char)) {
        if (current) {
          tokens.push(this.categorizeToken(current));
          current = '';
        }
        tokens.push({ type: char === '(' || char === ')' ? 'parenthesis' : 'operator', value: char });
        i++;
        continue;
      }

      // Handle built-in constants (PI, E, TAU, PHI)
      for (const k of Object.keys(this.BUILTIN_CONSTANTS)) {
        if (formula.slice(i, i + k.length).toUpperCase() === k) {
          if (current) {
            tokens.push(this.categorizeToken(current));
            current = '';
          }
          tokens.push({ type: 'number', value: String(this.BUILTIN_CONSTANTS[k]) });
          i += k.length;
          continue;
        }
      }

      current += char;
      i++;

      if (i === formula.length && current) {
        tokens.push(this.categorizeToken(current));
      }
    }

    return tokens;
  }

  private static categorizeToken(token: string): Token {
    if (!isNaN(Number(token))) {
      return { type: 'number', value: token };
    }
    if (this.ALLOWED_FUNCTIONS.has(token.toLowerCase())) {
      return { type: 'function', value: token.toLowerCase() };
    }
    return { type: 'variable', value: token };
  }

  private static validateTokens(tokens: Token[]): boolean {
    let parenthesesCount = 0;
    let lastType: Token['type'] | null = null;

    for (const token of tokens) {
      if (token.type === 'function' && !this.ALLOWED_FUNCTIONS.has(token.value)) {
        return false;
      }

      if (token.type === 'parenthesis') {
        if (token.value === '(') parenthesesCount++;
        if (token.value === ')') parenthesesCount--;
        if (parenthesesCount < 0) return false;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      lastType = token.type;
    }

    return parenthesesCount === 0;
  }

  static extractVariables(formula: string): string[] {
    if (!formula.startsWith('=')) {
      return [];
    }

    const tokens = this.tokenize(formula.slice(1));
    return tokens
      .filter(token => token.type === 'variable')
      .map(token => token.value)
      .filter((value, index, self) => self.indexOf(value) === index); // unique values
  }

  static evaluate(formula: string, variables: Record<string, number>): number {
    if (!formula.startsWith('=')) {
      throw new Error('Formula must start with =');
    }

    // Support custom constants (e.g., "K=1.414")
    // Parse custom constants from the formula string before '='
    let customConstants: Record<string, number> = {};
    let expr = formula;
    const assignMatch = expr.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\d\.eE+-]+)\s*;?/);
    if (assignMatch) {
      const [, key, val] = assignMatch;
      customConstants[key] = Number(val);
      expr = expr.slice(assignMatch[0].length);
      if (!expr.startsWith('=')) throw new Error('Formula must start with = after custom constant assignment');
    }

    const expression = expr.slice(1);
    // Merge built-in and custom constants into variables
    const allVars = { ...this.BUILTIN_CONSTANTS, ...customConstants, ...variables };
    const safeFunction = new Function(...Object.keys(allVars), `
      const Math = globalThis.Math;
      return ${expression};
    `);

    try {
      return safeFunction(...Object.values(allVars));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Syntax error in formula');
      }

      if (error instanceof Error) {
        throw new Error(`Formula evaluation error: ${error?.message}`);
      }
    }

    return 0;
  }
}