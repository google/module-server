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

var exec = require('child_process').exec;

var path = process.argv[2];
process.chdir(path);
var entryModule = process.argv[3];
var outputPath = process.argv[4];

function compile(cb) {
  var jsFiles = require('findit').sync('.').filter(function(filename) {
    return /\.js$/.test(filename);
  });
  console.log(jsFiles);
  var args = [
    '-jar', __dirname + '/third-party/closure-compiler/compiler.jar',
    '--common_js_entry_module', entryModule,
    '--process_common_js_modules',
    '--use_only_custom_externs', // TODO This is probably wrong.
    '--source_map_format', 'V3',
    '--create_source_map', '%outname%.map',
    '--module_output_path_prefix', outputPath
  ];
  jsFiles.forEach(function(filename) {
    args.push('--js', filename);
  });

  // console.log(args);
  console.log('Compiling ' + jsFiles.join(', ') + '...');
  run(args);

  function run(args) {
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
function compileIfIdle() {
  if (idle) {
    idle = false;
    compile(function() {
      idle = true;
    });
  }
}

compileIfIdle();

function onChange(type, o) {
  if (o.path !== 'graph.json') { // TODO get rid of this.
    console.log(type + ": " + o.path + (o.dir === true ? ' [DIR]' : ''))
    compileIfIdle();
  }
}

var Watcher = require("fs-watcher").watch;

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
