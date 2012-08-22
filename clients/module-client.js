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


function ModuleServer(urlPrefix, load, getUrl) {

  if (!urlPrefix) {
    urlPrefix = './';
  }

  if (!load) {
    (function() {
      var lab = $LAB;
      load = function(url, cb) {
        lab.script(url).wait(cb);
      };
    })()
  }

  if (!getUrl) {
    getUrl = function(urlPrefix, module, requested) {
      return urlPrefix.replace(/\/$/, '') + '/' + encodeURIComponent(module) +
          (requested.length > 0 ? '/' + encodeURIComponent(
              requested.join(',')) : '');
    };
  }

  var ModuleServer = function(urlPrefix) {
    this.urlPrefix = urlPrefix;
    this.requested = {};
    this.requestedList = [];
    this.loaded = {};
  };

  ModuleServer.prototype.load = function(module, cb) {
    var self = this;
    module = 'module$' + module.replace(/\//g, '$');
    if (this.loaded[module]) {
      cb()
      return;
    }
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

  var instance = new ModuleServer(urlPrefix);
  return function(module, cb) {
    instance.load(module, cb);
  };
};

// var require = ModuleServer();
