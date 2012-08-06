var path = require('path');
var fs = require('fs');

function JsModuleFile(pathPrefix, name) {
  this.filename = path.join(pathPrefix, name + '.js');
  // TODO(malteubl): Add async updates.
  this.js = fs.readFileSync(this.filename, 'utf8');
  this.map = JSON.parse(fs.readFileSync(this.filename + '.map', 'utf8'));
}

JsModuleFile.prototype.getNumberOfLines = function() {
  return this.js.split(/\n/).length;
};

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
    modules[name] = new JsModuleFile(pathPrefix, name);
  });

  var fn = function(moduleNames, excludeNames, onJs, options) {
    options = options || {};
    var debug = options.debug;
    var log = options.onLog || function() {};
    var createSourceMap = !!options.createSourceMap;
    log('Module request', moduleNames, excludeNames);
    try {
      var names = graph.getModules(moduleNames, excludeNames);
    } catch(e) {
      return onJs(e)
    }
    log('Serving modules', names);
    var js = '';
    var lineNumber = 1;
    var sourceMapSections = createSourceMap ? [] : null;
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (debug) {
        js += '/* Module: ' + name + ' */\n';
        lineNumber++;
      }
      var file = modules[name];
      js += file.js + '\n';
      if (createSourceMap) {
        var map = file.map;
        map.sourceRoot = options.sourceMapSourceRootUrlPrefix;
        sourceMapSections.push({
          offset: {
            line: lineNumber,
            column: 0, // That is why we always add an extra line.
          },
          map: map
        });
        lineNumber = lineNumber + file.getNumberOfLines();
      }
    }
    var sourceMap = createSourceMap ? {
      version: 3,
      file: "just-the-container.js",
      sections: sourceMapSections
    } : null;
    onJs(null, js.length, js, sourceMap);
  };
  fn.NotFoundException = graph.NotFoundException;

  return fn;
}