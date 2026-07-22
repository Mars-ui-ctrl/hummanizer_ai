const engine1 = require('./engine1');
const engine2 = require('./engine2');
const engine3 = require('./engine3');
const engine4 = require('./engine4');
const engine5 = require('./engine5');

/**
 * Engine Registry
 *
 * Maps method IDs to their engine modules.
 * To add a new method, import the engine and add it to the registry.
 */
const engines = {
  1: engine1,
  2: engine2,
  3: engine3,
  4: engine4,
  5: engine5,
};

/**
 * Get an engine by its method number.
 * @param {number} methodNumber
 * @returns {object} Engine module with a rewrite(text) function
 */
function getEngine(methodNumber) {
  const engine = engines[methodNumber];
  if (!engine) {
    throw new Error(`Engine for method ${methodNumber} not found`);
  }
  return engine;
}

module.exports = { getEngine, engines };
