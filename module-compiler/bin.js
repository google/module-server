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

var opt = require('opt').create();
var compiler = require('./module-compiler.js')

var config = opt.configSync({
	process_common_js_modules: true,
	source_map_format: 'V3',
	create_source_map: '%outname%.map',
  externs: []
}, []);

function usage() {
  opt.usage();
  console.log('Example: node bin.js --module_path=../test/fixtures/sample-module ' +
      '--entry_module=app --output_path=../build/');
  process.exit(0);
}

var path;
var watch = true;

opt.option(['-h', '--help'], usage, 'This help screen.');

opt.option(['-p', '--module_path'], function (p) {
  console.log(p);
  path = p.trim();
}, 'The search path for modules.');

opt.option(['-e', '--entry_module'], function (entryModule) {
  var filename = entryModule.trim();
  if (filename && !/\.js$/) {
    filename = filename + '.js';
  }

  config.common_js_entry_module = filename;
}, 'The file name of the main module from which all dependencies are derived.');

opt.option(['-o', '--output_path'], function (path) {
  config.module_output_path_prefix = (path.trim() || '').replace(/\/$/, '') + '/';
  config.output_module_dependencies = './module-graph.json';
}, 'The path to the output directory for compiled modules.');

opt.option(['--no-watch'], function () {
  watch = false;
}, 'Do not keep this program alive and watch for changes in input modules.');

opt.option(['--externs'], function (extern) {
  externs.push(extern);
}, 'Path to an extern file for closure compiler.');

opt.optionWith(process.argv);
if (path.length < 1 || !config.common_js_entry_module || !config.module_output_path_prefix) {
  usage();
}

compiler.compile(path, config);
if (watch) {
  compiler.watch(path, config);
}

// TODO get rid of the chdir dependency
