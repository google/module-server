var module = require('module/foo');

/*!
 * This won't be optimized away */

exports.test = function() {
  return module;
};
