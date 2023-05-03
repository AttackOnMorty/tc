const EvaTC = require('../src/EvaTC');

const tests = [
  require('./self-eval-test.js'),
  require('./math-test.js'),
  require('./variable-test.js'),
];

const eva = new EvaTC();

tests.forEach((test) => test(eva));

console.log('All assertions passed!');
