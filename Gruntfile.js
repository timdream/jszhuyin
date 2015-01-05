'use strict';

module.exports = function(grunt) {

  var HTTPD_PORT = 28080 + Math.floor(Math.random() * 10);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      data: 'data/data.txt'
    },
    shell: {
      'data': {
        command: './build/pull-mcbopomofo-data.sh',
        options: {
          stdout: true,
          stderr: true,
          failOnError: true
        }
      },
      'qunit-slimerjs': {
        command: './test/run-slimerjs.sh ' +
          'http://localhost:' + HTTPD_PORT + '/test/',
        options: {
          stdout: true,
          stderr: true,
          failOnError: true
        }
      }
    },
    connect: {
      test: {
        options: {
          port: HTTPD_PORT
        }
      }
    },
    qunit: {
      test: {
        options: {
          urls: [
            'http://localhost:' + HTTPD_PORT + '/test/'
          ]
        }
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'dot',
          ui: 'qunit'
        },
        src: ['test/build/**/*.js']
      }
    },
    jshint: {
      options: {
        jshintrc: true
      },
      all: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js',
        '!test/headless-runner.js', 'build/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Run tests
  grunt.registerTask('test', ['mochaTest', 'jshint', 'test-slimerjs']);

  // Run the test suite with QUnit on PhantomJS (currently broken.)
  grunt.registerTask('test-phantomjs', ['connect', 'qunit']);

  // Run the test suite with QUnit on SlimerJS
  grunt.registerTask('test-slimerjs', ['connect', 'shell:qunit-slimerjs']);

  // Pull data from McBopomofo repo and convert them to JSON.
  grunt.registerTask('data', ['shell:data', 'convert-data', 'clean:data']);

  // Quick shell command to rsync the code to my site
  grunt.registerTask('convert-data', function gruntDataFuncitonTask() {
    var convertData = require('./build/convert-data.js');
    var done = this.async();
    convertData('./data/data.txt', './data/database.data', done);
  });
};
