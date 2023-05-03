class TypeEnvironment {
  constructor(record = {}, parent = null) {
    this.record = record;
    this.parent = parent;
  }

  define(name, type_) {
    this.record[name] = type_;
    return type_;
  }

  lookup(name) {
    return this.resolve(name).record[name];
  }

  resolve(name) {
    if (this.record.hasOwnProperty(name)) {
      return this;
    }

    if (this.parent === null) {
      throw new ReferenceError(`Variable ${name} is not defined.`);
    }

    return this.parent.resolve(name);
  }
}

module.exports = TypeEnvironment;
