// Karma configuration
// Generated on Fri Apr 07 2017 15:43:36 GMT-0700 (PDT)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        // basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'requirejs'],


        // list of files / patterns to load in the browser
        files: [
            'test/test-main.js',
            { pattern: 'test/**/*spec.js', included: false },
            { pattern: 'client/admin/viewmodels/*.js', included: false },
            { pattern: 'client/admin/viewmodels/dialog/*.js', included: false },
            { pattern: 'client/board/viewmodels/*.js', included: false },
            { pattern: 'client/kiosk/viewmodels/*.js', included: false },
            { pattern: 'client/kiosk/viewmodels/dialog/*.js', included: false },
            { pattern: 'client/wall/viewmodels/*.js', included: false },
            { pattern: 'client/lib/**/*.js', included: false }
        ],


        // list of files to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'client/admin/viewmodels/*.js': ['coverage'],
            'client/admin/viewmodels/dialog/*.js': ['coverage'],
            'client/board/viewmodels/*.js': ['coverage'],
            'client/kiosk/viewmodels/*.js': ['coverage'],
            'client/wall/viewmodels/*.js': ['coverage']
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ["progress", "junit", "coverage"],

        junitReporter: {
            outputDir: "coverage/junit/",
            suite: 'models'
        },
		coverageReporter: {
			reporters: [
                { type: "text" },
                { type: "text-summary" },
                { type: "clover", dir: "coverage/", subdir: "clover", file: "clover.xml" },
                { type: "html", dir: "coverage/" }
			]
		},

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ["PhantomJS"],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    })
}
