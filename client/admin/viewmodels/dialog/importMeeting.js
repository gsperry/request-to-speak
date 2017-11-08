/* eslint no-console: "off" */
define(["plugins/http", "plugins/dialog", "durandal/app", "moment"], function(http, dialog, app, moment) {
    var ctor = function() {
        this.activate = function() {
            var self = this;
            http.get(app.agendaLocation + "meeting").then(function(data) {
                self.meetings = data;
            }, function(err) {
                console.log(err);
                app.showMessage("Error talking to agenda system.");
            });
        },
        this.meetings = [],
        this.selectedMeeting = null,
        this.selectMeeting = function(data) {
            this.selectedMeeting = data;
        }.bind(this),
        this.confirmSelection = function() {
            var self = this;
            http.get(app.agendaLocation + "item/" +
            this.selectedMeeting.sireId).then(function(data) {
                self.selectedMeeting.items = data;
                dialog.close(self, self.selectedMeeting);
            }, function(err) {
                console.log(err);
                app.showMessage("Error retrieving meeting items.");
            });
        };
    };
    ctor.prototype.format = function(date) {
        return moment(date).format("MMM Do YYYY");
    };

    ctor.prototype.closeDialog = function() {
        dialog.close(this);
    };

    return ctor;
});
