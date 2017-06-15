/* global process __dirname:true */
let gulp = require("gulp");
// var requireDir = require("require-dir");

let paths = {
    js: [
        "gulpfile.js",
        "index.js",
        "app/*.js",
        "client/*/main.js",
        "client/*/viewmodels/*.js",
        "client/*/viewmodels/dialog/*.js",
        "test/**/*.js",
        "client/lib/rts/*.js"
    ],
    app: [
        "client/index.html",
        "client/chair.html",
        "client/kiosk.html",
        "client/wall.html",
        "client/*/main.js",
        "client/*/viewmodels/*.js",
        "client/*/views/*.html"
    ],
    test: [
        "test/dev"
    ]
};

// Require all tasks in the 'gulp' folder.
// requireDir("./gulp", {recurse: false});

let eslint = require("gulp-eslint");
let reporter = require("eslint-bamboo-formatter");

gulp.task("lint", function() {
    return gulp.src(paths.js)
        .pipe(eslint())
        .pipe(eslint.format(reporter));
});

gulp.task("eslint", function() {
    gulp.src(paths.js)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

let browserSync = require("browser-sync").create();
gulp.task("browser-sync", function() {
    browserSync.init(null, {
        baseDir: "./client",
        proxy: {
            target: "http://localhost:3000",
            ws: true
        },
        open: false,
        port: 7000
    });

    gulp.watch(paths.app).on("change", browserSync.reload);
});

let nodemon = require("gulp-nodemon");
gulp.task("nodemon", function(cb) {
    let started = false;

    nodemon({
        script: "index.js"
    }).on("start", function() {
        if (!started) {
            cb();
            started = true;
        }
    });
});

let runSequence = require("run-sequence");
gulp.task("serve", function(cb) {
    runSequence("eslint", "browser-sync", cb);
});

gulp.task("test", function(cb) {
    let KarmaServer = require("karma").Server;
    new KarmaServer({
        configFile: __dirname + "/karma.conf.js",
        singleRun: true
    }, function(exitCode) {
        cb();
        process.exit(exitCode);
    }).start();
});

gulp.task("default", ["nodemon", "browser-sync"]);
