// ============================================
// Handlers Index v4.0
// 핸들러 통합 export
// ============================================

const authHandler = require('./auth');
const townHandler = require('./town');
const battleHandler = require('./battle');
const equipmentHandler = require('./equipment');
const shopHandler = require('./shop');
const exploreHandler = require('./explore');
const socialHandler = require('./social');
const { adminHandler, isAdmin } = require('./admin');

module.exports = {
  authHandler,
  townHandler,
  battleHandler,
  equipmentHandler,
  shopHandler,
  exploreHandler,
  socialHandler,
  adminHandler,
  isAdmin
};
