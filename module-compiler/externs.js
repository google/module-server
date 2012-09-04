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

var window;
// Just making sure, closure compiler by default likes to stomp on jQuery
// which we can lead to bad developer experience.
var $;
var $LAB; // Part of the standard client.

/**
 * Default recommended name for the function to load modules with ModuleServer.
 * Loads a module and then calls the callback once the loaded code is
 * available.
 * @param {string} name Name of the module to load. e.g. 'my/app'
 * @param {function(*)} cb Callback to be called when the module loaded.
 *   The callback retrieves the exports object of the loaded module as the 1st
 *   argument.
 */
window.loadModule = function(name, cb) {};

// Name of the default client
var ModuleServer;