class Type {
  constructor(name) {
    this.name = name;
  }

  static fromString(typeStr) {
    if (this.hasOwnProperty(typeStr)) {
      return this[typeStr];
    }

    if (typeStr.includes('Fn<')) {
      return Type.Function.fromString(typeStr);
    }

    throw `Unknown type: ${typeStr}`;
  }

  getName() {
    return this.name;
  }

  toString() {
    return this.getName();
  }

  equals(other) {
    return this.name === other.name;
  }
}

Type.number = new Type('number');

Type.string = new Type('string');

Type.boolean = new Type('boolean');

Type.Function = class extends Type {
  constructor({ name = null, paramTypes, returnType }) {
    super(name);
    this.paramTypes = paramTypes;
    this.returnType = returnType;
    this.name = this.getName();
  }

  static fromString(typeStr) {
    if (Type.hasOwnProperty(typeStr)) {
      return Type[typeStr];
    }

    let matched = /^Fn<(\w+)<([a-z,\s]+)>>$/.exec(typeStr);

    if (matched !== null) {
      const [_, returnTypeStr, paramString] = matched;

      const paramTypes = paramString
        .split(/,\s*/g)
        .map((param) => Type.fromString(param));

      return (Type[typeStr] = new Type.Function({
        name: typeStr,
        paramTypes,
        returnType: Type.fromString(returnTypeStr),
      }));
    }

    matched = /^Fn<(\w+)>$/.exec(typeStr);

    if (matched !== null) {
      const [_, returnTypeStr] = matched;
      return (Type[typeStr] = new Type.Function({
        name: typeStr,
        paramTypes: [],
        returnType: Type.fromString(returnTypeStr),
      }));
    }

    throw `Type.Function.fromString: Unknown type: ${typeStr}.`;
  }

  getName() {
    if (this.name === null) {
      const name = ['Fn<', this.returnType.getName()];
      if (this.paramTypes.length !== 0) {
        const params = [];
        for (const paramType of this.paramTypes) {
          params.push(paramType.getName());
        }
        name.push('<', params.join(', '), '>');
      }
      name.push('>');
    }

    return this.name;
  }

  equals(other) {
    if (this.paramTypes.length !== other.paramTypes.length) {
      return false;
    }

    for (let i = 0; i < this.paramTypes.length; i++) {
      if (!this.paramTypes[i].equals(other.paramTypes[i])) {
        return false;
      }
    }

    if (!this.returnType.equals(other.returnType)) {
      return false;
    }

    return true;
  }
};

module.exports = Type;
