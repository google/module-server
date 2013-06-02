#!/usr/bin/env node
var exec = require('child_process').exec;
var fs = require('fs');

console.log(__dirname, __filename);

fs.exists(__dirname + '/clients/third-party/LABjs/LAB.js', function(exists) {
  runServer = function() {
    require(__dirname + '/demo-server');
  };

  if (exists) {
    runServer();
    return;
  }
  
  var child = exec('cd ' + __dirname + ' && ls && git submodule update',
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    }
  );

  child.on('close', runServer); 
});


