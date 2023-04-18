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

    throw `Unknown type for expression ${exp}.`;
  }

  _isNumber(exp) {
    return typeof exp === 'number';
  }

  _isString(exp) {
    return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
  }
}

module.exports = EvaTC;
