/* eslint no-console: "off" */
define(["plugins/http", "plugins/dialog"], function(http, dialog) {
    var ctor = function() {
        this.activate = function() {
            var self = this;
            http.get(location.href.replace(/[^/]*$/, "") + "sire/meeting").then(function(data) {
                self.meetings = data;
            }, function() {
                // do error stuff
            });
        },
        this.meetings = [],
        this.selectedMeeting = null,
        this.selectMeeting = function(data) {
            this.selectedMeeting = data;
        }.bind(this),
        this.confirmSelection = function() {
            var self = this;
            http.get(location.href.replace(/[^/]*$/, "") + "sire/item/" + this.selectedMeeting.sireId).then(function(data) {
                self.selectedMeeting.items = data;
                dialog.close(self, self.selectedMeeting);
            }, function() {
                // do error stuff
            });
        };
    };
    ctor.prototype.closeDialog = function() {
        dialog.close(this);
    };
    return ctor;
});
