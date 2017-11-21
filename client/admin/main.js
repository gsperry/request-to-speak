/* global requirejs */
requirejs.config({
    paths: {
        "text": "../lib/require/text",
        "durandal": "../lib/durandal/js",
        "plugins": "../lib/durandal/js/plugins",
        "transitions": "../lib/durandal/js/transitions",
        "knockout": "../lib/knockout/knockout-3.4.0",
        "bootstrap": "../lib/bootstrap/js/bootstrap",
        "jquery": "../lib/jquery/jquery-1.9.1",
        "primus": "../primus/primus",
        "eventHandler": "../lib/rts/eventHandler",
        "dialog": "./viewmodels/dialog",
        "moment": "../lib/moment/moment.min"
    },
    shim: {
        "bootstrap": {
            deps: ["jquery"],
            exports: "jQuery"
        }
    }
});

define(["durandal/system", "durandal/app", "durandal/viewLocator", "bootstrap"], function(system, app, viewLocator) {
    // >>excludeStart("build", true);
    system.debug(true);
    // >>excludeEnd("build");

    app.title = "Request To Speak";

    app.configurePlugins({
        router: true,
        dialog: true,
        observable: true
    });

    app.apiLocation = location.href.replace(/[^/]*$/, "") + "api/";
    app.agendaLocation = location.href.replace(/[^/]*$/, "") + "agenda/";

    $(document).ajaxError(function(jqXHR, status, errorThrown) {
        if(status.status === 0) {
            location.reload();
        }
    });

    app.start().then(function() {
        // Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        // Look for partial views in a 'views' folder in the root.
        viewLocator.useConvention();

        // Show the app by setting the root view model for our application with a transition.
        app.setRoot("viewmodels/shell", "entrance");
    });
});
