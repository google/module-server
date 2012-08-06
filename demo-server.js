var http = require('http');
var fs = require('fs');

var SOURCE_DIR = 'test/fixtures';
var SOURCEMAP_PREFIX = '/_sourcemap';
var SOURCEMAP_PATH_PREFIX_REGEX = /^\/_sourcemap\//;
var ORIGINAL_SOURCE_PATH_PREFIX = 'http://127.0.0.1:1337/_js';
var ORIGINAL_SOURCE_PATH_PREFIX_REGEX = /^\/_js\//;

var moduleServer = require('./module-server').from(SOURCE_DIR + '/build',
    SOURCE_DIR + '/graph.json');

function jsForPath(path, isSourceMapRequest, onJs) {
  path = path.replace(/^\//, '');
  var parts = path.split(/\//);
  var modules = decodeURIComponent(parts.shift()).split(/,/);
  var options = {};
  parts.forEach(function(part) {
    var pair = part.split(/=/);
    options[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  });
  var exclude = null;
  if(options.exm) {
    exclude = options.exm.split(/,/);
  }
  return moduleServer(modules, exclude, onJs, {
    createSourceMap: isSourceMapRequest,
    sourceMapSourceRootUrlPrefix: ORIGINAL_SOURCE_PATH_PREFIX,
    debug: true,
    onLog: function() {
      console.log(arguments);
    }
  });
}

http.createServer(function (req, res) {
  var url = require('url').parse(req.url);
  console.log('Path ' + url.pathname);
  if (ORIGINAL_SOURCE_PATH_PREFIX_REGEX.test(url.pathname)) {
    var filename = SOURCE_DIR + '/' + url.pathname
        .replace(ORIGINAL_SOURCE_PATH_PREFIX_REGEX, '');
    fs.readFile(filename, 'utf8', function(err, js) {
      if (err) {
        throw err;
      } else {
        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Content-Length': js.length,
          'Pragma': 'no-cache'
        });
        res.end(js, 'utf8');
      }
    });
    return;
  }
  var isSourceMapRequest = false;
  if (SOURCEMAP_PATH_PREFIX_REGEX.test(url.pathname)) {
    isSourceMapRequest = true;
    url.pathname = url.pathname.replace(SOURCEMAP_PATH_PREFIX_REGEX, '/');
  }
  jsForPath(url.pathname, isSourceMapRequest, function(err, length, js,
      sourceMap) {
    if (err) {
      console.log('Error', err);
      if (err.statusCode) {
        res.writeHead(err.statusCode, {'Content-Type': 'text/plain'});
        res.end(err.message)
      } else {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Internal server error');
      }
    } else {
      if (isSourceMapRequest) {
        var map = JSON.stringify(sourceMap, null, ' ');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': map.length,
          'Pragma': 'no-cache'
        });
        res.end(map, 'utf8');
      } else {
        var mapUrl = SOURCEMAP_PREFIX + url.pathname;
        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Content-Length': length,
          'SourceMap': mapUrl,
          'X-SourceMap': mapUrl
        });
        res.end(js, 'utf8');
      }
    }
  });
}).listen(1337, '127.0.0.1');
console.log('Module server running at http://127.0.0.1:1337/');