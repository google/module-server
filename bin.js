#!/usr/bin/env node
var exec = require('child_process').exec;
var fs = require('fs');

fs.exists('clients/third-party/LABjs/LAB.js', function(exists) {
  runServer = function() {
    require('./demo-server');
  };

  if (exists) {
    runServer();
    return;
  }
  
  var child = exec('git submodule update',
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


