/**
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var exec = require('child_process').exec;

function compile(userArgs, cb) {
  var buildDir = userArgs.module_output_path_prefix
  var jsFiles = require('findit').sync('.').filter(function(filename) {
    return /\.js$/.test(filename) && !/^module\$/.test(filename);
  });
  var args = [
    '-jar', __dirname + '/third-party/closure-compiler/compiler.jar',
    // Adds default externs.
    '--externs', __dirname + '/externs.js',
  ];
  for (var key in userArgs) {
    // If the value is an array the key is appended one time per element in the
    // array.
    var vals = userArgs[key];
    if (!(vals instanceof Array)) {
      vals = [vals];
    }
    vals.forEach(function(val) {
      args.push('--' + key);
      // Closure compiler does not file --foo true.
      if (val !== true) {
        args.push(val);
      }
    })
  }
  jsFiles.forEach(function(filename) {
    args.push('--js', filename);
  });
  console.log('Compiling ' + jsFiles.join(', ') + '\n…');
  run(args);

  function run(args) {
    console.log('Running closure compiler: ' + JSON.stringify(args) + '\n…');
    var compiler = require('child_process').spawn('java', args, {
      stdio: 'inherit'
    });

    compiler.on('exit', function (code) {
      if (code === 0) {
        console.log('Compilation successful.');
        if (cb) {
          cb(null);
        }
      } else {
        console.log('Compilation failed.');
        if (cb) {
          cb(true);
        }
      }
    });
  }
}

var idle = true;
var count = 0;
function compileIfIdle(path, args) {
  if (count++ == 0) {
    // TODO remove this chdir.
    process.chdir(path);
  }
  if (idle) {
    idle = false;
    compile(args, function() {
      idle = true;
    });
  }
}

exports.compile = compileIfIdle;
exports.watch = function(path, args) {
  function onChange(type, o) {
    if (o.path !== 'module-graph.json') { // TODO get rid of this.
      console.log(type + ': ' + o.path + (o.dir === true ? ' [DIR]' : ''))
      compileIfIdle(path, args);
    }
  }
  var Watcher = require('fs-watcher').watch;

  var watcher = new Watcher({
    root: '.'
  });

  watcher.on('create', onChange.bind(null, 'create'));
  watcher.on('change', onChange.bind(null, 'change'));
  watcher.on('delete', onChange.bind(null, 'delete'));
  watcher.on('error', function() {
    console.log('Error watching');
  });

  watcher.start();
}


