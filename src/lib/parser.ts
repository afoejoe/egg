export type Token<T> =
  | {
      type: 'value';
      value?: T;
    }
  | {
      type: 'word';
      name?: string;
    }
  | { type: 'apply'; operator: Token<T>; args: Token<T>[] };

function parseExpression(program: string) {
  program = skipSpaces(program);
  let match, token: Token<string | number>;
  if ((match = /^"([^"]*)"/.exec(program))) {
    token = {
      type: 'value',
      value: match[1]
    };
  } else if ((match = /^\d+\b/.exec(program))) {
    token = {
      type: 'value',
      value: Number(match[0])
    };
  } else if ((match = /^[^\s(),#]+/.exec(program))) {
    token = {
      type: 'word',
      name: match[0]
    };
  } else {
    throw new SyntaxError(`Unexpected token ${program[0]}`);
  }

  return parseApply(token, program.slice(match[0].length));
}

function skipSpaces(expression: string) {
  const first = expression.search(/\S/);
  if (first == -1) return '';
  return expression.slice(first);
}

type ParseResult = {
  expr: Token<string | number> | { type: 'apply'; operator: Token<string | number>; args: Token<string | number>[] };
  rest: string;
};

function parseApply(expr: Token<string | number>, program: string): ParseResult {
  program = skipSpaces(program);
  if (program[0] != '(') {
    return {
      expr,
      rest: program
    };
  }

  program = skipSpaces(program.slice(1));
  expr = { type: 'apply', operator: expr, args: [] };
  while (program[0] != ')') {
    const arg = parseExpression(program);
    expr.args?.push(arg.expr);
    program = skipSpaces(arg.rest);
    if (program[0] == ',') {
      program = skipSpaces(program.slice(1));
    } else if (program[0] != ')') {
      throw new SyntaxError('Expected ) or , in argument list');
    }
  }
  return parseApply(expr, program.slice(1));
}

function parse(program: string) {
  const { expr, rest } = parseExpression(program);
  if (skipSpaces(rest).length > 0) {
    throw new SyntaxError('Unexpected character: ' + rest[0]);
  }
  return expr;
}

export { parse };
