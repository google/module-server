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
 * Creates a Module loader.
 * USAGE:
 *   window.loadModule = ModuleServer('http://url./of/your/module/server/');
 * @param {string} urlPrefix URL prefix of your module server.
 * @param {function(string,Function)=} load OPTIONAL function to load JS
 *     from a given URL, that fires a callback when the JS loaded. If
 *     you do not provide this function, you need to include $LAB.js in the
 *     current page. If you want to implement your own loader, make sure it
 *     supports executing JS in load order (ideally without blocking).
 * @param {Function=} getUrl OPTIONAL function to create a URL given the
 *     urlPrefix, the current module name and a list of modules that have
 *     already been requested. You will need to provide this if your server
 *     does not follow the conventions of demo-server.js.
 */
function ModuleServer(urlPrefix, load, getUrl) {
  if (!urlPrefix) {
    urlPrefix = './';
  }

  if (!load) {
    // Provide a default load function. This function assumes that $LAB.js is
    // present in the current page.
    (function() {
      var lab = window.$LAB;
      load = function(url, cb) {
        lab.script(url).wait(cb);
      };
    })()
  }

  if (!getUrl) {
    getUrl = function(urlPrefix, module, requested) {
      return urlPrefix.replace(/\/$/, '') + '/' + encodeURIComponent(module) +
          (requested.length > 0 ? '/' + encodeURIComponent(
              requested.sort().join(',')) : '');
    };
  }

  var Server = function(urlPrefix) {
    this.urlPrefix = urlPrefix;
    this.requested = {};
    this.requestedList = [];
    this.loaded = {};
  };

  Server.prototype.load = function(module, cb) {
    var self = this;
    module = 'module$' + module.replace(/\//g, '$');
    if (this.loaded[module] || ModuleServer.m[module]) {
      if (cb) {
        cb(ModuleServer.m[module]);
      }
      return;
    }
    var userCb = cb;
    cb = function() {
      if (userCb) {
        userCb(ModuleServer.m[module]);
      }
    };
    if (this.requested[module]) {
      this.requested[module].push(cb);
      return;
    }
    var before = this.requestedList.slice();
    this.requestedList.push(module);
    var cbs = this.requested[module] = [cb];
    load(getUrl(this.urlPrefix, module, before), function() {
      self.loaded[module] = true;
      self.requested[module] = null;
      for (var i = 0; i < cbs.length; i++) {
        cbs[i]();
      }
    });
  };

  var instance = new Server(urlPrefix);
  function loadModule(module, cb) {
    instance.load(module, cb);
  };
  loadModule.instanceForTesting_ = instance;
  return loadModule;
}

// Registry for loaded modules.
ModuleServer.m = {};

if (typeof exports != 'undefined') {
  exports.ModuleServer = ModuleServer;
}
