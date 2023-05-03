const Type = require('./Type');
const TypeEnvironment = require('./TypeEnvironment');

class EvaTC {
  constructor() {
    this.global = this._createGlobal();
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
    // Math operations:

    if (this._isBinary(exp)) {
      return this._binary(exp, env);
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

    throw `Unknown type for expression ${exp}.`;
  }

  _createGlobal() {
    return new TypeEnvironment({
      VERSION: Type.string,
    });
  }

  _isNumber(exp) {
    return typeof exp === 'number';
  }

  _isString(exp) {
    return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
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

  _checkArity(exp, arity) {
    if (exp.length - 1 !== arity) {
      throw `\nOperator ${exp[0]} expects ${arity} operands, ${
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
    throw `\nExpected ${expectedType} for ${value} in ${exp}, but got ${actualType} type.\n`;
  }

  _isVariableName(exp) {
    return typeof exp === 'string' && /^[+\-*/<>=a-zA-Z0-9_:]+$/.test(exp);
  }

  _tcBlock(block, env) {
    let result;

    const [_tag, ...expressions] = block;

    expressions.forEach((exp) => {
      result = this.tc(exp, env);
    });

    return result;
  }
}

module.exports = EvaTC;
