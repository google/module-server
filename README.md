Module Server
==============

Module server is a system for efficient serving of CommonJS modules to web browsers. It works within the following constraints:

- Requesting a module initiates exactly 1 HTTP request
- This single requests contains the the requested module and all its dependencies.
- Incremental loading (every module request after the first one) of additional modules only downloads dependencies that have not been requested already.
- The client does not need to download a dependency tree to decide which additional dependencies to download.

For many web applications serving all JavaScript in a single compiled binary may be a good enough, simple solution, more complex apps with large JS code bases will profit from only downloading code when it is needed. While AMD loaders such as require.js implement incremental loading as well, they often do so through recursive downloading of dependencies which may significantly degrade latency.

.h2 SourceMaps

By default all JS responses support sourcemaps for optimal debugging with Chrome Dev Tools (Don't forget to activate sourcemap support in the Dev Tools settings). We recommend to deactivate this for production, if you only want to provide clients access to obfuscated JS

.h2 Setup

See demo-server.js for an example server. You may want to adapt this to your individual serving stack (such as as for use within express). We recommend doing actual serving through a caching reverse proxy CDN network for minimal latency.

.h2 Client

clients/module-client.js provides the in-browser module loader. It depends on $LAB.js but should be easily adaptable to most JS loaders.

TODO example

.h2 Compiler

module-compiler/bin.js is a wrapper around closure compiler for compiling JS for serving with Module Server. Run with --help for usage. It supports watching a directly tree for automatic compilation when you change your sources and it ships with closure compiler for easy installation.

Make sure you have java in your path.