/* Loads every core file in the right order (used by the API and the tests). */
const path = require('path');
const files = ['util', 'currencies', 'interests', '../data/regions', '../data/venues', 'engine', 'geo', 'items', 'store-memory', 'invites'];
files.forEach((f) => require(path.join(__dirname, f)));
module.exports = globalThis.DV;
