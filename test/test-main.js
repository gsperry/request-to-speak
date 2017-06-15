var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
        // then do not normalize the paths
        var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, "");
        allTestFiles.push(normalizedTestModule);
    }
});

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: "/base",

    paths: {
        "requestAdmin": "client/admin/viewmodels/request",
        "meetingAdmin": "client/admin/viewmodels/meeting",
        "kiosk": "client/kiosk/viewmodels/kiosk",
        "board": "client/board/viewmodels/board",
        "wall": "client/wall/viewmodels/wall",
        "text": "client/lib/require/text",
        "durandal": "client/lib/durandal/js",
        "plugins": "client/lib/durandal/js/plugins",
        "transitions": "client/lib/durandal/js/transitions",
        "knockout": "client/lib/knockout/knockout-3.4.0",
        "bootstrap": "client/lib/bootstrap/js/bootstrap",
        "jquery": "client/lib/jquery/jquery-1.9.1",
        "primus": "client/lib/primus/primus",
        "eventHandler": "client/lib/rts/eventHandler",
        "dialog": "client/admin/viewmodels/dialog",
        "kioskDialog": "client/kiosk/viewmodels/dialog"
    },
    shim: {
        "bootstrap": {
            deps: ["jquery"],
            exports: "jQuery"
        }
    },

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
});
