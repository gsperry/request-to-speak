/* eslint no-console: "off" */
define(["plugins/http", "plugins/dialog"], function(http, dialog) {
    var ctor = function() {
        this.activate = function(req) {
            this.request = req;
        };
        this.request = {};
        this.save = function() {
            dialog.close(this, this.request);
        };
    };
    ctor.prototype.closeDialog = function() {
        dialog.close(this);
    };
    return ctor;
});
