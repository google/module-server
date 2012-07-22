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
  var filename = 'fixtures/graph.json';
  var data = getJson(filename);
  var graph = moduleGraph.fromFilename(filename);
  t.is(graph.getAllModules().length, 6);
  t.is(graph.getAllModules()[0], data[0].name);

  var modules = graph.getModules(['module$app']);
  t.equivalent(modules, ['module$module$foo', 'module$module',
      'module$module$baz$foo', 'module$sub_app', 'module$module$bar',
      'module$app']);

  var modules = graph.getModules(['module$sub_app']);
  t.equivalent(modules, ['module$sub_app']);

  var modules = graph.getModules(['module$sub_app', 'module$module$bar']);
  t.equivalent(modules, ['module$sub_app', 'module$module$bar']);

  var notFound = 'Does not exist';
  t.throws(function() {
    graph.getModules(['module$sub_app', notFound]);
  }, new graph.NotFoundException(notFound));

  var modules = graph.getModules(['module$app'], ['module$sub_app']);
  t.equivalent(modules, ['module$module$foo', 'module$module',
      'module$module$baz$foo', 'module$module$bar',
      'module$app']);

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

  t.end();
});

function getJson(filename) {
  return JSON.parse(require('fs').readFileSync(filename, 'utf8'));
}