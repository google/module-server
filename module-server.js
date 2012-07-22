var path = require('path');
var fs = require('fs');

/**
 * Make a module server that serves JS from memory and loads it from disk.
 * @param {string} pathPrefix Directory where JS files can be found. JS files
 *     are expected to be pathPrefix + name + '.js'
 * @param {string} graphFilename Filename of a module graph serialization.
 * @return {function(Array.<string>,Array.<string>,
 *     function(Error,number,string),Object)}
 */
exports.from = function(pathPrefix, graphFilename) {
  var graph = require('./module-graph').fromFilename(graphFilename);

  var modules = {};

  graph.getAllModules().forEach(function(name) {
    var filename = path.join(pathPrefix, name + '.js');
    var js = fs.readFileSync(filename, 'utf8');
    modules[name] = js;
  });

  var fn = function(moduleNames, excludeNames, onJs, options) {
    options = options || {};
    var debug = options.debug;
    var log = options.onLog || function() {};
    log('Module request', moduleNames, excludeNames);
    try {
      var names = graph.getModules(moduleNames, excludeNames);
    } catch(e) {
      return onJs(e)
    }
    log('Serving modules', names);
    var js = '';
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (debug) {
        js += '/* Module: ' + name + ' */\n';
      }
      js += modules[name];
    }
    onJs(null, js.length, js);
  };
  fn.NotFoundException = graph.NotFoundException;

  return fn;
}