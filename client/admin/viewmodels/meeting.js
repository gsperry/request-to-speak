/* eslint no-console: "off" */
define(["plugins/http", "plugins/router", "durandal/app", "dialog/importMeeting", "dialog/editMeeting", "moment"],
function(http, router, app, Import, Edit, moment) {
    var ret = {
        displayName: "Meeting",
        activeMeeting: null,
        canImport: false,
        meetings: [],
        activate: function() {
            var self = this;
            http.get(app.apiLocation + "meeting").then(function(response) {
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
            http.get(app.agendaLocation).then(function(response) {
                self.canImport = true;
            }, function(e) {
            });
        },
        startMeeting: function(meeting) {
            http.post(app.apiLocation + "startMeeting/" + meeting.meetingId).then(function(result) {
                app.showMessage("Meeting started successfully.").then(function() {
                    router.navigate("/request");
                });
            }, function(err) {
                app.showMessage("Unable to start meeting.\n" + JSON.stringify(err.responseText));
            });
        },
        importMeeting: function() {
            var self = this;
            app.showDialog(new Import()).then(function(response) {
                if(response !== undefined) {
                    // Since it is an import, add the OffAgenda item.
                    response.items.push({
                        itemOrder: 0,
                        itemName: "Off Agenda",
                        timeToSpeak: 3
                    });
                    // Since it is an import, format the date.
                    response.meetingDate = self.format(response.meetingDate);
                    // Make sure not already in list
                    if(self.meetings.filter(function(m) {
                        return m.sireId === response.sireId;
                    }).length > 0) {
                        // Ask to overwrite
                        app.showMessage("The meeting you selected is already in RTS. Do you want to overwrite?",
                            "Meeting exists", ["Yes", "No"]).then(function(resp) {
                                if(resp === "Yes") {
                                    var old = self.meetings.find(function(m) {
                                        return m.sireId === response.sireId;
                                    });

                                    http.remove(app.apiLocation + "meeting/" + old.meetingId).then(function() {
                                        self.meetings.splice(self.meetings.findIndex(function(f) {
                                            return f.meetingId === old.meetingId;
                                        }), 1);
                                        console.log("Meeting deleted.");
                                        // splice meeting
                                        // add meeting
                                        self.addMeeting(response);
                                    }, function(err) {
                                        app.showMessage("Unable to delete meeting.\n" + JSON.stringify(err));
                                    });
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
        addMeeting: function(meeting) {
            var self = this;
            http.post(app.apiLocation + "meeting", meeting).then(function(response) {
                meeting.meetingId = response.meetingId;
                self.meetings.push(meeting);
                console.log("Meeting added.");
            }, function(err) {
                app.showMessage("Unable to add meeting.\n" + JSON.stringify(err));
            });
        },
        newMeeting: function() {
            return newMeeting = {
                meetingName: "New Meeting",
                meetingDate: this.format(new Date()),
                status: "new",
                items: [],
                requests: []
            };
        }
    };

    ret.deleteMeeting = function(meeting) {
        var self = this;
        app.showMessage("Are you sure you want to delete this meeting?", "Delete Meeting",
        ["Yes", "No"]).then(function(result) {
            if(result === "Yes") {
                http.remove(app.apiLocation + "meeting/" + meeting.meetingId).then(function() {
                    self.meetings.splice(self.meetings.findIndex(function(f) {
                        return f.meetingId === meeting.meetingId;
                    }), 1);
                    console.log("Meeting deleted.");
                }, function(err) {
                    app.showMessage("Unable to delete meeting.\n" + JSON.stringify(err));
                });
            }
        });
    }.bind(ret);

    ret.format = function(date) {
        var ret = moment(date).format("MMM Do YYYY"); 
        
       //in case db api saves in our odd format: 
       if(ret === "Invalid date") { 
           ret = moment(date, "MMM Do YYYY").format("MMM Do YYYY"); 
       } 
       return ret;
    };

    ret.editMeeting = function(meeting) {
        var self = this;
        app.showDialog(new Edit(), meeting).then(function(response) {
            if(response !== undefined) {
                if(self.meetings.includes(response)) {
                    http.put(app.apiLocation + "meeting/" + meeting.meetingId, meeting).then(function(response) {
                        console.log("Meeting added.");
                    }, function(err) {
                        app.showMessage("Unable to update meeting. Please refresh.\n" + JSON.stringify(err));
                    });
                } else {
                    http.post(app.apiLocation + "meeting", meeting).then(function(response) {
                        meeting.meetingId = response.meetingId;
                        self.meetings.push(meeting);
                        console.log("Meeting added.");
                    }, function(err) {
                        app.showMessage("Unable to add meeting.\n" + JSON.stringify(err));
                    });
                }
            } else {
                http.get(app.apiLocation + "meeting/" + meeting.meetingId).then(function(response) {
                    self.meetings.splice(self.meetings.indexOf(meeting), 1, response);
                });
            }
        }, function(err) {
            // Do error stuff
        });
    }.bind(ret);

    return ret;
});
