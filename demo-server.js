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

var http = require('http');
var fs = require('fs');

var SOURCE_DIR = __dirname + '/test/fixtures/sample-module';
var SOURCEMAP_PREFIX = '/_sourcemap';
var SOURCEMAP_PATH_PREFIX_REGEX = /^\/_sourcemap\//;
var ORIGINAL_SOURCE_PATH_PREFIX = 'http://127.0.0.1:1337/_js';
var ORIGINAL_SOURCE_PATH_PREFIX_REGEX = /^\/_js\//;

require('./module-server').from(SOURCE_DIR + '/../build',
    SOURCE_DIR + '/module-graph.json', run);

function run(err, moduleServer) {
  if (err) {
    throw err;
  }
  function jsForPath(path, isSourceMapRequest, onJs) {
    path = path.replace(/^\//, '');
    var parts = path.split(/\//);
    var modules = decodeURIComponent(parts.shift()).split(/,/);
    var exclude = null;
    if (parts.length) {
      exclude = decodeURIComponent(parts.shift()).split(/,/);
    }
    return moduleServer(modules, exclude, onJs, {
      createSourceMap: isSourceMapRequest,
      sourceMapSourceRootUrlPrefix: ORIGINAL_SOURCE_PATH_PREFIX,
      debug: true,
      onLog: console.log
    });
  }

  http.createServer(function (req, res) {
    var url = require('url').parse(req.url);
    // Load static files for demo
    switch(url.pathname) {
      case "/demo.html":
        fs.readFile(__dirname + '/clients/test/demo.html', 'utf8', function (err, html) {
          if(err) {
            throw err;
          } else {
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Content-Length': html.length
            });
            res.end(html, 'utf8');
          }
        });
        return;
      case "/third-party/LABjs/LAB.src.js":
        fs.readFile(__dirname + '/clients/third-party/LABjs/LAB.src.js', 'utf8', function (err, js) {
          if(err) {
            throw err;
          } else {
            res.writeHead(200, {
              'Content-Type': 'application/javascript',
            });
            res.end(js, 'utf8');
          }
        });
        return; 
      case "/module-client.js":
        fs.readFile(__dirname + '/clients/module-client.js', 'utf8', function (err, js) {
          if(err) {
            throw err;
          } else {
            res.writeHead(200, {
              'Content-Type': 'application/javascript',
            });
            res.end(js, 'utf8');
          }
        });
        return;
    }
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
}
