define(["plugins/router", "durandal/app"], function(router, app) {
    return {
        router: router,
        search: function() {
            // It's really easy to show a message box.
            // You can add custom options too. Also, it returns a promise for the user's response.
            app.showMessage("Search not yet implemented...");
        },
        activate: function() {
            router.map([
                {route: "request", moduleId: "viewmodels/request", nav: true},
                {route: "meeting", moduleId: "viewmodels/meeting", nav: true}
            ]).buildNavigationModel();

            return router.activate();
        }
    };
});
