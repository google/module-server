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

var moduleGraph = require('../module-graph.js');

test('instantiation', function(t) {
  var name = 'foo';
  var deps = ['bar'];
  var data = [{
    name: name,
    'transitive-requires': deps
  }];
  var graph = moduleGraph.fromSerialization(data);
  t.is(graph.getAllModules().length, 1);
  t.is(graph.getAllModules()[0], name);
  t.is(graph.getTransitiveDependencies(name), deps);
  t.end();
});

test('graph', function(t) {
  var filename = 'fixtures/sample-module/module-graph.json';
  var data = getJson(filename);
  moduleGraph.fromFilename(filename, function(err, graph) {
    t.is(err, null);
    t.is(graph.getAllModules().length, 6);
    t.is(graph.getAllModules()[0], data[0].name);

    var modules = graph.getModules(['module$app']);
    t.equivalent(modules, ['module$module$bar', 'module$module$baz$foo',
        'module$sub_app', 'module$module$foo', 'module$module', 'module$app']);

    var modules = graph.getModules(['module$sub_app']);
    t.equivalent(modules, ['module$sub_app']);

    var modules = graph.getModules(['module$sub_app', 'module$module$bar']);
    t.equivalent(modules, ['module$sub_app', 'module$module$bar']);

    var notFound = 'Does not exist';
    t.throws(function() {
      graph.getModules(['module$sub_app', notFound]);
    }, new graph.NotFoundException(notFound));

    var modules = graph.getModules(['module$app'], ['module$sub_app']);
    t.equivalent(modules, ['module$module$bar', 'module$module$baz$foo',
        'module$module$foo', 'module$module', 'module$app']);

    var modules = graph.getModules(['module$app'], ['module$module$foo',
        'module$sub_app']);
    t.equivalent(modules, ['module$module', 'module$app']);

    var modules = graph.getModules(['module$app'], ['module$app',
        'module$module$foo', 'module$sub_app']);
    t.equivalent(modules, []);

    t.throws(function() {
      graph.getModules(['module$app'], ['module$app', notFound]);
      t.equivalent(modules, []);
    }, new graph.NotFoundException(notFound));

    var modules = graph.getModules(['module$sub_app'], ['module$app']);
    t.equivalent(modules, []);

    moduleGraph.fromFilename('DOESNOTEXISTwefasdfasdfasdfewf', function(err) {
      t.ok(!!err);
      t.end();
    });
  });
});

function getJson(filename) {
  return JSON.parse(require('fs').readFileSync(filename, 'utf8'));
}