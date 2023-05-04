const { test } = require('./test-util');
const Type = require('../src/Type');

module.exports = (eva) => {
  test(
    eva,
    `
    (var x 10)
    (while (!= x 0)
      (set x (- x 1)))
    x
  `,
    Type.number
  );
};
