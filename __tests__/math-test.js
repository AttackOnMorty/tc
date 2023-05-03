const { test } = require('./test-util');
const Type = require('../src/Type');

module.exports = (eva) => {
  // Math.
  test(eva, ['+', 2, 3], Type.number);
  test(eva, ['-', 1, 5], Type.number);
  test(eva, ['*', 4, 2], Type.number);
  test(eva, ['/', 2, 3], Type.number);

  // String concat.
  test(eva, ['+', '"Hello, "', '"world!"'], Type.string);
};
