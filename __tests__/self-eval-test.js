const { test } = require('./test-util');
const Type = require('../src/Type');

module.exports = (eva) => {
  // Numbers
  test(eva, 42, Type.number);

  // Strings
  test(eva, '"hello"', Type.string);

  // Boolean.
  test(eva, true, Type.boolean);
  test(eva, false, Type.boolean);
};
