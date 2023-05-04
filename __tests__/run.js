const EvaTC = require('../src/EvaTC');

const tests = [
  require('./self-eval-test'),
  require('./math-test'),
  require('./variable-test'),
  require('./block-test'),
  require('./if-test'),
  require('./while-test'),
  require('./user-defined-function-test'),
  require('./built-in-function-test'),
  require('./lambda-function-test'),
];

const eva = new EvaTC();

tests.forEach((test) => test(eva));

console.log('All assertions passed!');
