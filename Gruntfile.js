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
      }
    },
    connect: {
      test: {
        options: {
          port: HTTPD_PORT
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

  grunt.loadNpmTasks('grunt-contrib-connect');

  // Run tests
  grunt.registerTask('test', ['mochaTest', 'jshint', 'test-slimerjs']);

  // Run the test suite with QUnit on SlimerJS
  grunt.registerTask('test-slimerjs', ['connect', 'qunit-slimerjs']);

  // Pull data from McBopomofo repo and convert them to our binary data.
  grunt.registerTask('data', ['shell:data', 'convert-data', 'clean:data']);

  // Quick shell command to rsync the code to my site
  grunt.registerTask('convert-data', function gruntDataFuncitonTask() {
    var McBopomofoDataConverter =
      require('./build/mcbopomofo_data_converter.js');

    var converter = new McBopomofoDataConverter();
    converter.onprogress = function(stage, loadedEntries, totalEntries) {
      switch (stage) {
        case this.STAGE_READING_FILE:
          grunt.log.write('Reading file...');

          break;
        case this.STAGE_CATEGORIZING_ENTRIES:
          if (!loadedEntries) {
            grunt.log.ok();
            grunt.log.write('Categorizing ' + totalEntries + ' entries...');
            grunt.verbose.writeln('');
          } else if ((loadedEntries % 1000) === 0) {
            grunt.verbose.or.write('.');
          }
          grunt.verbose.writeln(loadedEntries + '/' + totalEntries);

          break;

        case this.STAGE_SORTING_ENTRIES:
          if (!loadedEntries) {
            grunt.log.ok();
            grunt.log.write('Sorting and packing into binary entries...');
            grunt.verbose.writeln('');
          } else if ((loadedEntries % 1000) === 0) {
            grunt.verbose.or.write('.');
          }
          grunt.verbose.writeln(loadedEntries);

          break;

        case this.STAGE_CREATING_BLOB:
          if (!loadedEntries) {
            grunt.log.ok();
            grunt.log.write('Creating blob from binary entries...');
            grunt.verbose.writeln('');
          } else if ((loadedEntries % 1000) === 0) {
            grunt.verbose.or.write('.');
          }
          grunt.verbose.writeln(loadedEntries);

          break;

        case this.STAGE_WRITING_FILE:
          grunt.log.ok();

          grunt.log.write('Writing blob into disk...');

          break;

        case this.STAGE_IDLE:
          grunt.log.ok();

          break;

        default:
          throw new Error('Unknown stage: ' + stage);
      }
    };
    converter.onwarning = function(subject, message) {
      console.warn(subject + ': ' + message);
    };

    converter.convert('./data/data.txt', './data/database.data');
  });

  // Glue script for executing SlimerJS
  grunt.registerTask('qunit-slimerjs', function runQUnitSlimerJS() {
    var done = this.async();

    var childProcess = require('child_process');
    var slimerjs = require('slimerjs');
    var path = require('path');

    var url = 'http://localhost:' + HTTPD_PORT + '/test/';
    var binPath = slimerjs.path;
    var childArgs = [path.join(__dirname, 'test', 'headless-runner.js'), url];

    grunt.log.writeln('Testing ' + url);

    var cp = childProcess.execFile(
      binPath, childArgs,
      function(err, stdout, stderr) {
        if (err || stderr || stdout.indexOf(', 0 failed.') === -1) {
          done(false);
        } else {
          done();
        }
      });
    cp.stdout.pipe(process.stdout);
    cp.stderr.pipe(process.stderr);
  });
};
