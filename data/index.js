// ============================================
// Data 모듈 통합 export v4.0
// ============================================

const images = require('./images');
const jobs = require('./jobs');
const monsters = require('./monsters');
const bosses = require('./bosses');
const items = require('./items');
const dialogs = require('./dialogs');
const config = require('./config');

module.exports = {
  ...images,
  ...jobs,
  ...monsters,
  ...bosses,
  ...items,
  ...dialogs,
  ...config
};
