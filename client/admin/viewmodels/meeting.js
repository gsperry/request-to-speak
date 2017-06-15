/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/router", "plugins/dialog", "dialog/import"],
function(http, app, router, dialog, Import) {
    var ret = {
        displayName: "Meeting",
        activeMeeting: null,
        meetings: [],
        selectedMeeting: null,
        activate: function() {
            var self = this;
            http.get(location.href.replace(/[^/]*$/, "") + "meeting").then(function(response) {
                self.selectedMeeting = null;
                self.meetings = response;
                var startedMeetings = self.meetings.filter(function(meeting) {
                    meeting.status === "started";
                });
                if(startedMeetings.length > 0) {
                    app.showMessage("A meeting is active. You will not be able to edit the active meeting.");
                    self.activeMeeting = startedMeetings[0];
                }
            }, function(err) {
                app.showMessage("Unable to connect to database.");
            });
        },
        startMeeting: function() {
            http.post(location.href.replace(/[^/]*$/, "") + "startMeeting/" + this.selectedMeeting.meetingId).then(function(result) {
                app.showMessage("Meeting started successfully.").then(function() {
                    router.navigate("/request");
                });
            }, function(err) {
                app.showMessage("Unable to start meeting.\n" + JSON.stringify(err));
            });
        },
        newMeeting: function() {
            return {
                meetingId: "12",
                meetingName: "The twelfth one",
                items: [
                    {
                        itemId: "100",
                        itemName: "1",
                        defaultTimeToSpeak: 2
                    },
                    {
                        itemId: "101",
                        itemName: "2",
                        defaultTimeToSpeak: 3,
                        subTopics: [
                            {
                                subTopicId: "1",
                                subTopicName: "First sub-topic"
                            },
                            {
                                subTopicId: "2",
                                subTopicName: "The second sub-topic"
                            }
                        ]
                    }
                ]
            };
        },
        importMeeting: function() {
            var self = this;
            app.showDialog(new Import()).then(function(response) {
                if(response !== undefined) {
                    // Make sure not already in list
                    if(self.meetings.filter(function(m) {
                        return m.sireId === response.sireId;
                    }).length > 0) {
                        // Ask to overwrite
                        app.showMessage("The meeting you selected is already in RTS. Do you want to overwrite?",
                            "Meeting exists", ["Yes", "No"]).then(function(resp) {
                                if(resp === "Yes") {
                                    self.addMeeting(response);
                                }
                            });
                    } else {
                        // Not in list. Add to list
                        self.addMeeting(response);
                    }
                }
            }, function(err) {
                // Do error stuff
            });
        },
        saveMeeting: function() {
            http.put(location.href.replace(/[^/]*$/, "") + "meeting/" + this.selectedMeeting.meetingId,
                this.selectedMeeting).then(function() {
                    console.log("Meeting saved.");
                }, function(err) {
                    app.showMessage("Unable to save meeting.\n" + JSON.stringify(err));
                });
        },
        addMeeting: function(meeting) {
            var self = this;
            http.post(location.href.replace(/[^/]*$/, "") + "meeting", meeting).then(function(response) {
                meeting.meetingId = response.meetingId;
                self.meetings.push(meeting);
                self.selectedMeeting = meeting;
                console.log("Meeting added.");
            }, function(err) {
                app.showMessage("Unable to add meeting.\n" + JSON.stringify(err));
            });
        }
    };
    ret.selectMeeting = function(meeting) {
        if(this.selectedMeeting === meeting) {
            return;
        }
        if(this.selectedMeeting !== null && this.meetings.includes(this.selectedMeeting) === false) {
            app.showMessage("This meeting has not been saved.");
        }
        if(meeting === this.activeMeeting) {
            app.showMessage("The meeting you selected is active. You cannot edit an active meeting.");
            return;
        }
        this.selectedMeeting = meeting;
    }.bind(ret);

    return ret;
});
