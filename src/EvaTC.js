const Type = require('./Type');

class EvaTC {
  tc(exp) {
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
      return this._binary(exp);
    }

    throw `Unknown type for expression ${exp}.`;
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

  _binary(exp) {
    this._checkArity(exp, 2);

    const t1 = this.tc(exp[1]);
    const t2 = this.tc(exp[2]);

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
}

module.exports = EvaTC;
