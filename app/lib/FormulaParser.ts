import type { ParameterMetadata } from "~/types/Formula";

type Token = {
  type: 'number' | 'operator' | 'function' | 'variable' | 'parenthesis';
  value: string;
};

export class FormulaParser {
  private static readonly ALLOWED_FUNCTIONS = new Set([
    'sin', 'cos', 'tan', 'abs', 'sqrt', 'pow', 'exp', 'log',
    'floor', 'ceil', 'round', 'min', 'max'
  ]);

  private static readonly OPERATORS = new Set(['+', '-', '*', '/', '^', '(', ')']);

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

      if (this.OPERATORS.has(char)) {
        if (current) {
          tokens.push(this.categorizeToken(current));
          current = '';
        }
        tokens.push({ type: char === '(' || char === ')' ? 'parenthesis' : 'operator', value: char });
        i++;
        continue;
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

    const expression = formula.slice(1);
    const safeFunction = new Function(...Object.keys(variables), `
      const Math = globalThis.Math;
      return ${expression};
    `);

    try {
      return safeFunction(...Object.values(variables));
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