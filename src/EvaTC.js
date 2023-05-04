const Type = require('./Type');
const TypeEnvironment = require('./TypeEnvironment');

class EvaTC {
  constructor() {
    this.global = this._createGlobal();
  }

  tcGlobal(exp) {
    return this._tcBody(exp, this.global);
  }

  tc(exp, env = this.global) {
    // --------------------------------------------
    // Self-evaluating:

    /**
     * Numbers: 10
     */
    if (this._isNumber(exp)) {
      return Type.number;
    }

    /**
     * Strings: "hello"
     */
    if (this._isString(exp)) {
      return Type.string;
    }

    // --------------------------------------------
    // Boolean: true | false

    if (this._isBoolean(exp)) {
      return Type.boolean;
    }

    // --------------------------------------------
    // Math operations:

    if (this._isBinary(exp)) {
      return this._binary(exp, env);
    }

    // --------------------------------------------
    // Boolean binary:

    if (this._isBooleanBinary(exp)) {
      return this._booleanBinary(exp, env);
    }

    // --------------------------------------------
    // Type declaration/alias: (type <name> <base>)

    if (exp[0] === 'type') {
      const [_tag, name, base] = exp;

      if (Type.hasOwnProperty(name)) {
        throw `Type ${name} is already defined: ${Type[name]}.`;
      }

      if (!Type.hasOwnProperty(base)) {
        throw `Type ${base} is not defined.`;
      }

      return (Type[name] = new Type.Alias({ name, parent: Type[base] }));
    }

    // --------------------------------------------
    // Class declaration: (class <Name> <Super> <Body>)

    if (exp[0] === 'class') {
      const [_tag, name, superClassName, body] = exp;
      const superClass = Type[superClassName];
      const classType = new Type.Class({ name, superClass });

      Type[name] = env.define(name, classType);
      this._tcBody(body, classType.env);

      return classType;
    }

    // --------------------------------------------
    // Class instantiation: (new <Class> <Arguments>...)

    if (exp[0] === 'new') {
      const [_tag, className, ...argValues] = exp;
      const classType = Type[className];

      if (classType === null) {
        throw `Unknown class ${className}.`;
      }

      const argTypes = argValues.map((arg) => this.tc(arg, env));

      return this._checkFunctionCall(
        classType.getField('constructor'),
        [classType, ...argTypes],
        env,
        exp
      );
    }

    // --------------------------------------------
    // Property access: (prop <instance> <name>)

    if (exp[0] === 'prop') {
      const [_tag, instance, name] = exp;
      const instanceType = this.tc(instance, env);

      return instanceType.getField(name);
    }

    // --------------------------------------------
    // Super expressions: (super <ClassName>)

    if (exp[0] === 'super') {
      const [_tag, className] = exp;
      const classType = Type[className];

      if (classType === null) {
        throw `Unknown class ${className}.`;
      }

      return classType.superClass;
    }

    // --------------------------------------------
    // Variable declaration: (var x 10)
    //
    // With type check: (var (x number) "foo") // error

    if (exp[0] === 'var') {
      const [_tag, name, value] = exp;
      const valueType = this.tc(value, env);

      if (Array.isArray(name)) {
        const [varName, typeStr] = name;
        const expectedType = Type.fromString(typeStr);
        this._expect(valueType, expectedType, value, exp);

        return env.define(varName, valueType);
      }

      return env.define(name, valueType);
    }

    // --------------------------------------------
    // Variable access: foo

    if (this._isVariableName(exp)) {
      return env.lookup(exp);
    }

    // --------------------------------------------
    // Block: sequence of expressions

    if (exp[0] === 'begin') {
      const blockEnv = new TypeEnvironment({}, env);
      return this._tcBlock(exp, blockEnv);
    }

    // --------------------------------------------
    // Variable update: (set x 10)

    if (exp[0] === 'set') {
      const [_tag, ref, value] = exp;

      const valueType = this.tc(value, env);
      const varType = this.tc(ref, env);

      return this._expect(valueType, varType, value, ref);
    }

    // --------------------------------------------
    // if-expression:
    //
    //    Γ ⊢ e1 : boolean  Γ ⊢ e2 : t  Γ ⊢ e3 : t
    //   ___________________________________________
    //
    //           Γ ⊢ (if e1 e2 e3) : t
    //
    // Both branches should return the same time t.
    //

    if (exp[0] === 'if') {
      const [_tag, condition, consequent, alternate] = exp;

      const t1 = this.tc(condition, env);
      this._expect(t1, Type.boolean, condition, exp);

      const t2 = this.tc(consequent, env);
      const t3 = this.tc(alternate, env);

      return this._expect(t3, t2, alternate, exp);
    }

    // --------------------------------------------
    // while-expression:

    if (exp[0] === 'while') {
      const [_tag, condition, body] = exp;

      const t1 = this.tc(condition, env);
      this._expect(t1, Type.boolean, condition, exp);

      return this.tc(body, env);
    }

    // --------------------------------------------
    // Function declaration: (def square ((x number)) -> number (* x x))
    //
    // Syntactic sugar for: (var square (lambda ((x number)) -> number (* x x)))

    if (exp[0] === 'def') {
      const varExp = this._transformDefToVarLambda(exp);

      const name = exp[1];
      const params = exp[2];
      const returnTypeStr = exp[4];

      const paramTypes = params.map(([name, typeStr]) =>
        Type.fromString(typeStr)
      );

      env.define(
        name,
        new Type.Function({
          paramTypes,
          returnType: Type.fromString(returnTypeStr),
        })
      );

      return this.tc(varExp, env);
    }

    // --------------------------------------------
    // Lambda function: (lambda ((x number)) -> number (* x x))

    if (exp[0] === 'lambda') {
      const [_tag, params, _retDel, returnTypeStr, body] = exp;

      return this._tcFunction(params, returnTypeStr, body, env);
    }

    // --------------------------------------------
    // Function calls.
    //
    // (square 2)

    if (Array.isArray(exp)) {
      const fn = this.tc(exp[0], env);
      const argValues = exp.slice(1);
      const argTypes = argValues.map((arg) => this.tc(arg, env));

      return this._checkFunctionCall(fn, argTypes, env, exp);
    }

    throw `Unknown type for expression ${exp}.`;
  }

  _createGlobal() {
    return new TypeEnvironment({
      VERSION: Type.string,

      sum: Type.fromString('Fn<number<number,number>>'),
      square: Type.fromString('Fn<number<number>>'),
    });
  }

  _tcBody(body, env) {
    if (body[0] === 'begin') {
      return this._tcBlock(body, env);
    }
    return this.tc(body, env);
  }

  _tcBlock(block, env) {
    let result;

    const [_tag, ...expressions] = block;

    expressions.forEach((exp) => {
      result = this.tc(exp, env);
    });

    return result;
  }

  _isNumber(exp) {
    return typeof exp === 'number';
  }

  _isString(exp) {
    return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
  }

  _isBoolean(exp) {
    return typeof exp === 'boolean' || exp === 'true' || exp === 'false';
  }

  _isBinary(exp) {
    return /^[+\-*/]$/.test(exp[0]);
  }

  _binary(exp, env) {
    this._checkArity(exp, 2);

    const t1 = this.tc(exp[1], env);
    const t2 = this.tc(exp[2], env);

    const allowedTypes = this._getOperandTypesForOperator(exp[0]);

    this._expectOperatorType(t1, allowedTypes, exp);
    this._expectOperatorType(t2, allowedTypes, exp);

    return this._expect(t2, t1, exp[2], exp);
  }

  _isBooleanBinary(exp) {
    return (
      exp[0] === '==' ||
      exp[0] === '!=' ||
      exp[0] === '>=' ||
      exp[0] === '<=' ||
      exp[0] === '>' ||
      exp[0] === '<'
    );
  }

  _booleanBinary(exp, env) {
    this._checkArity(exp, 2);

    const t1 = this.tc(exp[1], env);
    const t2 = this.tc(exp[2], env);

    this._expect(t2, t1, exp[2], exp);

    return Type.boolean;
  }

  _isVariableName(exp) {
    return typeof exp === 'string' && /^[+\-*/<>=a-zA-Z0-9_:]+$/.test(exp);
  }

  _transformDefToVarLambda(exp) {
    const [_tag, name, params, _retDel, returnTypeStr, body] = exp;
    return ['var', name, ['lambda', params, _retDel, returnTypeStr, body]];
  }

  _tcFunction(params, returnTypeStr, body, env) {
    const returnType = Type.fromString(returnTypeStr);

    const paramsRecord = {};
    const paramTypes = [];

    params.forEach(([name, typeStr]) => {
      const paramType = Type.fromString(typeStr);
      paramsRecord[name] = paramType;
      paramTypes.push(paramType);
    });

    const fnEnv = new TypeEnvironment(paramsRecord, env);

    const actualReturnType = this._tcBody(body, fnEnv);

    if (!actualReturnType.equals(returnType)) {
      throw `Expected function ${body} to return ${returnType}, but got ${actualReturnType}.`;
    }

    return new Type.Function({
      paramTypes,
      returnType,
    });
  }

  _checkFunctionCall(fn, argTypes, env, exp) {
    if (fn.paramTypes.length !== argTypes.length) {
      throw `\nFunction ${exp} ${fn.getName()} expects ${
        fn.paramTypes.length
      } arguments, ${argTypes.length} given in ${exp}.\n`;
    }

    argTypes.forEach((argType, index) => {
      this._expect(argType, fn.paramTypes[index], argTypes[index], exp);
    });

    return fn.returnType;
  }

  _checkArity(exp, arity) {
    if (exp.length - 1 !== arity) {
      throw `\nOperator '${exp[0]}' expects ${arity} operands, ${
        exp.length - 1
      } given in ${exp}.\n`;
    }
  }

  _getOperandTypesForOperator(operator) {
    switch (operator) {
      case '+':
        return [Type.string, Type.number];
      case '-':
        return [Type.number];
      case '/':
        return [Type.number];
      case '*':
        return [Type.number];
      default:
        throw `Unknown operator: ${operator}.`;
    }
  }

  _expectOperatorType(type_, allowedTypes, exp) {
    if (!allowedTypes.some((t) => t.equals(type_))) {
      throw `\nUnexpected type: ${type_} in ${exp}. Allowed: ${allowedTypes}.\n`;
    }
  }

  _expect(actualType, expectedType, value, exp) {
    if (!actualType.equals(expectedType)) {
      this._throw(actualType, expectedType, value, exp);
    }
    return actualType;
  }

  _throw(actualType, expectedType, value, exp) {
    throw `\nExpected "${expectedType}" type for ${value} in ${JSON.stringify(
      exp
    )}, but got "${actualType}" type.\n`;
  }
}

module.exports = EvaTC;
