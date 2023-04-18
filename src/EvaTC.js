class EvaTC {
  tc(exp) {
    if (this._isNumber(exp)) {
      return 'number';
    }

    if (this._isString(exp)) {
      return 'string';
    }

    throw `Unknown type for expression ${exp}.`;
  }

  _isNumber(exp) {
    return typeof exp === 'number';
  }

  _isString(exp) {
    return (
      typeof exp === 'string' && exp[0] === '"' && exp[exp.length - 1] === '"'
    );
  }
}

module.exports = EvaTC;
