/**
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * Module for module graphs and dependency calculation.
 */

var fs = require('fs');

/**
 * Make a ModuleGraph from an object as it is output by closure compiler
 * when passed the TODO compiler flag.
 * @param {Array.<Object>} modules Array of module definitions.
 * @return {ModuleGraph}
 */
exports.fromSerialization = function(modules) {
  return new ModuleGraph(modules);
};

// TODO: Should this exist. Nice for convenience, but there should almost
// certainly not be more data access methods in this module.
/**
 * Make a ModuleGraph from a file as it is output by closure compiler
 * when passed the TODO compiler flag.
 * @param {string} filename Filename of the module graph file.
 * @apram {function(Error, ModuleGraph)}
 * @return {ModuleGraph}
 */
exports.fromFilename = function(filename, cb) {
  fs.readFile(filename, 'utf8', function(err, str) {
    if (err) {
      return cb(err);
    }
    cb(null, new ModuleGraph(JSON.parse(str)));
  });
};

function Module(info) {
  this.name = info.name;
  this.inputs = info.inputs;
  this.transitiveDeps = info['transitive-requires'];
}

Module.prototype.toString = function() {
  return '<Module: ' + this.name + '>';
};

/**
 * A module graph class.
 * @constructor
 */
function ModuleGraph(moduleData) {
  var self = this;
  var modules = {};
  var moduleNameList = [];
  moduleData.forEach(function(info) {
    var m = new Module(info);
    modules[info.name] = m;
    moduleNameList.push(info.name);
  });

  /**
   * Get a list of all module names.
   * @return {Array.<string>} List of module names.
   */
  this.getAllModules = function() {
    return moduleNameList;
  };

  /**
   * Get transitive dependencies for a given module
   * @param {string} name Name of the module.
   * @return {Array.<string>} List of module names.
   */
  this.getTransitiveDependencies = function(name) {
    var m = getModule(name);
    return m.transitiveDeps || [];
  };

  function getModule(name) {
    var m = modules[name];
    if (!m) {
      throw new self.NotFoundException(name);
    }
    return m;
  }

  /**
   * Error object used when a requested module cannot be found.
   * @constructor
   */
  this.NotFoundException = function(name) {
    var msg = 'Unknown module: ' + name;
    this.name = name;
    this.message = msg;
    Error.call(this, msg);
  };
  this.NotFoundException.prototype = new Error();
  this.NotFoundException.prototype.statusCode = 404;

  /**
   * Gets the requested module names and their transitive deps minus the
   * transitive deps (and the) of the optional excluded names.
   * @param {Array.<string>} moduleNames List of module names.
   * @apram {Array.<string>} opt_excludeNames List of module names to exclude.
   * @return {Array.<string>} List of module names.
   */
  this.getModules = function(moduleNames, opt_excludeNames) {
    var list = [];
    var seen = {};
    var exclude = {};

    if (opt_excludeNames) {
      opt_excludeNames.forEach(function(name) {
        exclude[name] = true;
        var m = getModule(name);
        m.transitiveDeps.forEach(function(name) {
          exclude[name] = true;
        });
      });
    }

    function addModule(name) {
      if (!seen[name] && !exclude[name]) {
        seen[name] = true;
        list.push(name)
      }
    }
    moduleNames.forEach(function(name) {
      var m = getModule(name);
      m.transitiveDeps.forEach(addModule);
      addModule(m.name);
    });
    return list;
  };
}