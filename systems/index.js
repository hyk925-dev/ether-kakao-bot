// systems/index.js

const battle = require('./battle');
const enhance = require('./enhance');
const items = require('./items');
const explore = require('./explore');

module.exports = {
  ...battle,
  ...enhance,
  ...items,
  ...explore
};
