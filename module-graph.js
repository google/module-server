var fs = require('fs');

exports.fromSerialization = function(modules) {
  return new ModuleGraph(modules);
};

exports.fromFilename = function(filename) {
  var str = fs.readFileSync(filename, 'utf8');
  return new ModuleGraph(JSON.parse(str));
};

function Module(info) {
  this.name = info.name;
  this.inputs = info.inputs;
  this.transitiveDeps = info['transitive-requires'];
}

Module.prototype.toString = function() {
  return '<Module: ' + this.name + '>';
};

function ModuleGraph(moduleData) {
  var self = this;
  var modules = {};
  var moduleNameList = [];
  moduleData.forEach(function(info) {
    var m = new Module(info);
    modules[info.name] = m;
    moduleNameList.push(info.name);
  });

  this.getAllModules = function() {
    return moduleNameList;
  };

  this.getTransitiveDependencies = function(name) {
    var m = modules[name];
    if (!m) {
      return null;
    }
    return m.transitiveDeps;
  };

  function getModule(name) {
    var m = modules[name];
    if (!m) {
      throw new self.NotFoundException('Unknown module: ' + name);
    }
    return m;
  }

  this.NotFoundException = function(msg) {
    Error.call(this, msg);
  };
  this.NotFoundException.prototype = new Error();
  this.NotFoundException.prototype.statusCode = 404;

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