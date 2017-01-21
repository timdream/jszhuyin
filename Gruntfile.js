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
          reporter: 'spec',
          ui: 'qunit'
        },
        src: ['test/build/**/*.js', 'test/interaction/test_node.js']
      }
    },
    jshint: {
      options: {
        jshintrc: true
      },
      all: ['Gruntfile.js',
        'service-worker.js',
        'lib/**/*.js',
        'test/**/*.js',
        'build/**/*.js',
        'assets/*.js']
    },
    karma: {
      options: {
        configFile: 'karma.conf.js',
        singleRun: true
      },
      benchmark: {
        options: {
          browserNoActivityTimeout: 0,
          files: [ /* To set elsewhere */ ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.loadNpmTasks('grunt-karma');

  // Run tests
  grunt.registerTask('test', ['mochaTest', 'jshint', 'karma:test']);

  // Run benchmark
  grunt.registerTask('benchmark',
    ['check-database', 'benchmark:generate-steps',
     'benchmark:set-config', 'karma:benchmark']);

  grunt.registerTask('check-database', function() {
    const fs = require('fs');
    if (!fs.existsSync('./data/database.data')) {
      throw new Error('Datafile does not exist. Run npm run grunt data to create the database.');
    }
  });

  grunt.registerTask('benchmark:generate-steps', function() {
    const fs = require('fs');
    const { JSZhuyin } = require('.');
    var jszhuyin = new JSZhuyin();
    jszhuyin.load();

    var text = fs.readFileSync('./test/benchmark/corpus.txt', { encoding: 'utf-8' });

    const { TestStepsGenerator } =
      require('./test/benchmark/test_steps_generator.js');

    grunt.log.write('May take a while...');
    var generator = new TestStepsGenerator(text);
    var flags = [
      0,
      generator.FLAG_CONFIRM_EVERY_PHRASE
    ];
    var steps = flags
      .map(function(flag) {
        return generator.generateSteps(flag);
      });

    fs.writeFileSync('./test/benchmark/steps.json',
      JSON.stringify(steps, null, 2));
  });

  grunt.registerTask('benchmark:set-config', function() {
    // See https://github.com/karma-runner/grunt-karma/issues/21
    grunt.config('karma.benchmark.options.files', [
      'lib/client.js',
      'test/benchmark/test.js',

      { pattern: 'test/**', included: false },
      { pattern: 'data/**', included: false },
      { pattern: 'lib/**', included: false }
    ]);
  });

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
};
