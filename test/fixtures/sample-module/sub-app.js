exports.subApp = function() {
  return 'sub';
};

exports.testLoad = function() {
  loadModule('module/baz/foo', function(foo) {

  })
};