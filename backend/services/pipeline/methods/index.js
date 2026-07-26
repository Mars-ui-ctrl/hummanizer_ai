/**
 * Method Pipeline Registry
 *
 * Maps method numbers 1..5 to their respective pipeline runners.
 */

const method1 = require('./method1');
const method2 = require('./method2');
const method3 = require('./method3');
const method4 = require('./method4');
const method5 = require('./method5');

const methods = {
  1: method1,
  2: method2,
  3: method3,
  4: method4,
  5: method5,
};

/**
 * Get a method pipeline runner by method number.
 * @param {number} methodNumber
 * @returns {object} Method module with a run(text) function
 */
function getMethodPipeline(methodNumber) {
  const method = methods[methodNumber];
  if (!method) {
    throw new Error(`Pipeline method ${methodNumber} not found. Valid methods: 1-5.`);
  }
  return method;
}

module.exports = { getMethodPipeline, methods };
