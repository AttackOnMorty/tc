const { test } = require('./test-util');
const Type = require('../src/Type');

module.exports = (eva) => {
  // Numbers
  test(eva, 10, Type.number);

  // Strings
  test(eva, '"hello"', Type.string);
};
