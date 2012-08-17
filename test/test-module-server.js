var test = require('tap').test;

var server = require('../module-server').from('./fixtures/build',
    './fixtures/graph.json');

test('module server', function(t) {
  t.plan(11);

  var subApp = getJs('module$sub_app');
  server(['module$sub_app'], [], function(err, length, js, sourceMap) {
    t.is(err, null);
    t.is(js, subApp);
    t.is(length, subApp.length);
    t.is(sourceMap, null);
  });

  var expectedJs = subApp + getJs(['module$module$bar',
      'module$module$baz$foo', 'module$module$foo']);
  server(['module$sub_app', 'module$module$foo'], [],
      function(err, length, js) {
    t.is(err, null);
    t.is(js, expectedJs);
    t.is(length, expectedJs.length);
  });

  var expectedJs = subApp + getJs(['module$module$bar', 'module$module$foo']);
  server(['module$sub_app', 'module$module$foo'], ['module$module$baz$foo'],
      function(err, length, js) {
    t.is(err, null);
    t.is(js, expectedJs);
    t.is(length, expectedJs.length);
  });

  var notFound = 'not found';
  server(['not found', 'module$sub_app', 'module$module$foo'],
      ['module$module$baz$foo'],
      function(err, length, js) {
    t.equivalent(err, new server.NotFoundException(notFound));
  });
});

test('logging', function(t) {
  t.plan(5);
  var expectedJs = getJs(['module$sub_app','module$module$bar',
      'module$module$foo']);
  server(['module$sub_app', 'module$module$foo'], ['module$module$baz$foo'],
      function(err, length, js) {
    t.is(err, null);
    t.is(js, expectedJs);
    t.is(length, expectedJs.length);
  }, {
    onLog: function(type, names, excludedNames) {
      t.pass()
    }
  });
});

test('source maps', function(t) {
  t.plan(21);

  var prefix = 'http://prefix';

  var options = {
    createSourceMap: true,
    sourceMapSourceRootUrlPrefix: prefix
  };

  var files = ['module$sub_app', 'module$module$bar', 'module$module$foo'];

  var expectedJs = getJs(files);
  server(['module$sub_app', 'module$module$foo'], ['module$module$baz$foo'],
      function(err, length, js, map) {
    t.is(err, null);
    t.is(js, expectedJs);
    t.is(length, expectedJs.length);
    t.ok(map != null);
    t.is(map.version, 3);
    t.ok(typeof map.file === 'string'); // we don't care about the value;
    var sections = map.sections;
    t.ok(sections != null);
    t.ok(sections.length, 3);
    var s0 = sections[0];
    t.is(s0.offset.line, 1);
    t.is(s0.offset.column, 0);
    t.ok(s0.map);
    t.ok(s0.map.version, 3);
    t.is(s0.map.file, files[0]);
    t.ok(s0.map.mappings);
    t.is(s0.map.sourceRoot, prefix);

    t.is(sections[1].offset.line, 3);
    t.is(sections[1].offset.column, 0);
    t.is(sections[1].map.file, files[1]);
    t.is(sections[2].offset.line, 5);
    t.is(sections[2].offset.column, 0);
    t.is(sections[2].map.file, files[2]);
  }, options);
});

function getJs(names) {
  if (typeof names === 'string') {
    names = [names];
  }
  var js = '';
  names.forEach(function(name) {
    var filename = './fixtures/build/' + name + '.js';
    js += require('fs').readFileSync(filename, 'utf8') + '\n';
  });
  return js;
}