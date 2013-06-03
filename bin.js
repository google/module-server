#!/usr/bin/env node
var exec = require('child_process').exec;
var fs = require('fs');

fs.exists(__dirname + '/clients/third-party/LABjs/LAB.js', function(exists) {
  runServer = function() {
    require(__dirname + '/demo-server');
  };

  if (exists) {
    runServer();
    return;
  }
 
  // JIC we haven't run the npm setup script
  var child = exec('cd ' + __dirname + ' && git submodule update',
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


