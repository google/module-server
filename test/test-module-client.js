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

var test = require('tap').test;

var URL_PREFIX = 'https://prefix';

var ModuleServer = require('../clients/module-client.js').ModuleServer;

test('loading-modules', function(t) {
  var loaded = [];
  var cbs = [];
  var modules = [];
  function cb(module) {
    modules.push(module);
  }
  function mockLoad(url, cb) {
    loaded.push(url);
    cbs.push(cb);
  }

  var loadModule = ModuleServer(URL_PREFIX, mockLoad);
  loadModule('foo/bar/baz', cb);
  t.is(loaded.length, 1);
  t.is(cbs.length, 1);
  var module0 = 'module$foo$bar$baz'
  t.is(loaded[0], URL_PREFIX + '/' + encodeURIComponent(module0));
  ModuleServer.m[module0] = {
    foo: true
  };
  cbs[0]();
  t.is(modules.length, 1);
  t.ok(modules[0].foo);

  // Incremental load
  loadModule('foo/bar', cb);
  t.is(loaded.length, 2);
  t.is(cbs.length, 2);
  var module1 = 'module$foo$bar'
  t.is(loaded[1], URL_PREFIX + '/' + encodeURIComponent(module1) + '/' +
      encodeURIComponent(module0));
  ModuleServer.m[module1] = {
    bar: true
  };
  cbs[1]();
  t.is(modules.length, 2);
  t.ok(modules[1].bar);

  // Load something again
  loadModule('foo/bar', cb);
  t.is(loaded.length, 2);
  t.is(cbs.length, 2);
  t.is(modules.length, 3);
  t.ok(modules[2].bar);

  // More incremental load
  loadModule('aaa', cb);
  t.is(loaded.length, 3);
  t.is(cbs.length, 3);
  var module2 = 'module$aaa'
  t.is(loaded[2], URL_PREFIX + '/' + encodeURIComponent(module2) + '/' +
      encodeURIComponent(module1 + ',' + module0));
  ModuleServer.m[module2] = {
    aaa: true
  };
  cbs[2]();
  t.is(modules.length, 4);
  t.equivalent(modules[3], ModuleServer.m[module2]);
  t.end();
});