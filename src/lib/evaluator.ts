import { Token, parse } from './parser';

const specialForms = Object.create(null);
const topScope = Object.create(null);

topScope.true = true;
topScope.false = false;

for (const op of ['+', '-', '*', '/', '==', '<', '>']) {
  topScope[op] = Function('a, b', `return a ${op} b;`);
}

topScope.print = (value: unknown) => {
  console.log(value);
  return value;
};

specialForms.if = (args: Token<string | number>[], scope: Record<string, unknown>) => {
  if (args.length !== 3) {
    throw new SyntaxError('Bad number of args to if');
  }

  if (evaluate(args[0], scope) !== false) {
    return evaluate(args[1], {});
  }

  return evaluate(args[2], scope);
};

specialForms.while = (args: Token<string | number>[], scope: Record<string, unknown>) => {
  if (args.length !== 2) {
    throw new SyntaxError('Bad number of args to while');
  }

  while (evaluate(args[0], scope) !== false) {
    evaluate(args[1], scope);
  }

  return false;
};

specialForms.do = (args: Token<string | number>[], scope: Record<string, unknown>) => {
  let value: unknown = false;
  for (let i = 0; i < args.length; ++i) {
    value = evaluate(args[i], scope);
  }

  return value;
};

specialForms.define = (args: Token<string | number>[], scope: Record<string, unknown>) => {
  if (args.length !== 2 || args[0].type !== 'word') {
    throw new SyntaxError('Bad number of args to define');
  }

  const value = evaluate(args[1], scope);
  if (args[0].name) {
    scope[args[0].name] = value;
  }

  return value;
};

export function evaluate(expr: Token<string | number>, scope: Record<string, unknown>): string | number | unknown {
  if (expr.type === 'value') {
    return expr.value;
  }

  if (expr.type === 'word') {
    if (expr.name && expr.name in scope) {
      return scope[expr.name];
    }

    throw new ReferenceError(`Undefined binding: ${expr.name}`);
  }

  if (expr.type === 'apply') {
    const { operator, args } = expr;
    if (operator.type === 'word' && operator.name && operator.name in specialForms) {
      return specialForms[operator.name](expr, scope);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const op = <(...args: unknown[]) => void>evaluate(operator, scope);
    if (typeof op !== 'function') {
      throw new TypeError('Applying non-function.');
    }

    const argsValues = args.map((arg) => evaluate(arg, scope));
    return op(...argsValues);
  }
}

function run(program: string) {
  const tokens = parse(program);
  const scope = Object.create(topScope);
  return evaluate(tokens, scope);
}

export { run };
