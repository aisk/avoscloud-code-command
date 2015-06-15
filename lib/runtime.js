var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    run = require('../bin/run');

exports.detect = function(appPath, cb) {
  if (fs.existsSync(path.join(appPath, 'cloud', 'main.js'))){ // cloud code v2.0
    return getCloudCodeRuntimeInfo(appPath, cb);
  } else if (fs.existsSync(path.join(appPath, 'server.js'))) { // Node.js
    return getNodeRuntimeInfo(appPath, cb);
  } else if (fs.existsSync(path.join(appPath, 'requirements.txt')) &&
             fs.existsSync(path.join(appPath, 'wsgi.py'))) { // Python
    return getPythonRuntimeInfo(appPath, cb);
  } else {
    cb(new Error('不在 LeanEngine 项目根目录，或目录结构不对。'));
  }
};

getCloudCodeRuntimeInfo = function(appPath, cb) {
  var runjs = path.join(path.dirname(fs.realpathSync(__filename)), '../bin/cloudcodeRun.js');
  cb(null, {
    exec: 'node',
    setDebug: function(debug) {
      if (debug) {
        this.exec = 'node debug';
      }
    },
    getMonconfig: function(args) {
      return {
        exec: this.exec,
        ignore: [
          '.git',
          'node_modules/**/node_modules'
        ],
        watch: [
          'cloud/'
        ],
        ext: 'js json coffee',
        script: runjs,
        args: args
      };
    },
    bulk: function() {
      return [{ src: ['package.json', 'cloud/**', 'config/**', 'public/**']}]
    }
  });
}

var getNodeRuntimeInfo = function(appPath, cb) {
  var app = run.getAppSync();
  run.initMasterKey(function(masterKey) {
    cb(null, {
      exec: 'node',
      setDebug: function(debug) {
        if (debug) {
          this.exec = 'node debug';
        }
      },
      getMonconfig: function(args) {
        return {
          exec: this.exec,
          ignore: [
            '.git',
            'node_modules/**/node_modules'
          ],
          "env": {
            LC_APP_ID: app.appId,
            LC_APP_KEY: masterKey,
            LC_APP_MASTER_KEY: masterKey,
            LC_APP_PORT: run.getPort()
          },
          ext: 'js json coffee',
          script: 'server.js',
          args: args
        };
      },
      bulk: function() {
        return [{ src: ['**', '!node_modules/**']}]
      }
    });
  });
}

var getPythonRuntimeInfo = function(appPath, cb) {
  var app = run.getAppSync();
  run.initMasterKey(function(masterKey) {
    cb(null, {
      exec: 'python',
      setDebug: function(debug) {
        if (debug) {
          this.exec = 'python -m pdb';
        }
      },
      getMonconfig: function(args) {
        return {
          exec: this.exec,
          ignore: [
            '.git'
          ],
          "env": {
            LC_APP_ID: app.appId,
            LC_APP_KEY: masterKey,
            LC_APP_MASTER_KEY: masterKey,
            LC_APP_PORT: run.getPort()
          },
          ext: 'py',
          script: 'wsgi.py',
          args: args
        };
      },
      bulk: function() {
        return [{ src: ['**', '!bin/**', '!include/**', '!lib/**', '!pip-selfcheck.json']}]
      }
    });
  });
}
