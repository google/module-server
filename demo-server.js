var http = require('http');

var moduleServer = require('./module-server').from('test/fixtures/build',
    'test/fixtures/graph.json');

function jsForPath(path, onJs) {
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
    debug: true,
    onLog: function() {
      console.log(arguments);
    }
  });
}

http.createServer(function (req, res) {
  var url = require('url').parse(req.url);
  console.log('Path ' + url.pathname);
  jsForPath(url.pathname, function(err, length, js) {
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
      res.writeHead(200, {
        'Content-Type': 'application/javascript',
        'Content-Length': length,
      });
      res.end(js, 'utf8');
    }
  });
}).listen(1337, '127.0.0.1');
console.log('Module server running at http://127.0.0.1:1337/');