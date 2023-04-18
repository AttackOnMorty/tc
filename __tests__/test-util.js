const assert = require('assert');

function exec(eva, exp) {
  return eva.tc(exp);
}

function test(eva, exp, expected) {
  const actual = exec(eva, exp);
  try {
    assert.strictEqual(actual.equals(expected), true);
  } catch (e) {
    console.log(`\nExpected ${expected} type for ${exp}, but got ${actual}.\n`);
    throw e;
  }
}

module.exports = {
  exec,
  test,
};
