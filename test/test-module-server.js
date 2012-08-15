var test = require('tap').test;

var server = require('../module-server').from('./fixtures/build',
    './fixtures/graph.json');

test('module server', function(t) {
  t.plan(10);

  var subApp = getJs('module$sub_app');
  server(['module$sub_app'], [], function(err, length, js) {
    t.is(err, null);
    t.is(js, subApp);
    t.is(length, subApp.length);
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
})

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