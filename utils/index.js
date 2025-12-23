// utils/index.js

const db = require('./db');
const calc = require('./calc');
const text = require('./text');
const response = require('./response');
const stats = require('./stats');

module.exports = {
  ...db,
  ...calc,
  ...text,
  ...response,
  ...stats
};
