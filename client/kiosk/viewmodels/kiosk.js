/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "kioskDialog/items", "eventHandler", "jquery"],
function(http, app, observable, Items, event, $) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        step: 0,
        request: {},
        meeting: {},
        isSubmitting: false,
        confirmSubmission: false,
        itemSelector: false,
        messages: [],
        primus: null,
        disconnected: function() {
            location.reload();                
        },
        reconnected: function() {
            // make http call to check if auth session is dead.
            http.get("/", function(data) {
                console.log(data)
            }, function(err) {
                console.log(err);
            });
        },
        attached: function() {
        },
        deactivate: function() {
            if(this.primus) {
                this.primus.end();
            }
        },
        activate: function() {
            this.request = this.newRequest();
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "kiosk");
            }
        },
        meetingMessage: function(message) {
            console.log("Meeting message");
            if(message.event === "started") {
                this.isMeetingActive = true;
                this.meeting = message.meeting;
            } else {
                this.isMeetingActive = false;
                this.meeting = {items: []};
            }
            this.request = this.newRequest();
        },
        initializeMessage: function(message) {
            console.log("Initializing kiosk");
            this.meeting = message.meetingData;
            if(message.meetingData.status === "started") {
                this.isMeetingActive = true;
                this.request = this.newRequest();
                this.step = 0;
            } else {
                this.isMeetingActive = false;
            }
        },
        prevStep: function() {
            this.step -= 1;
        },
        submitRequest: function() {
            this.isSubmitting = true;
            var self = this;
            http.post(app.apiLocation + "request", this.request).then(function() {
                self.confirmSubmission = true;
                setTimeout(function() {
                    self.confirmSubmission = false;
                    self.request = self.newRequest();
                    self.step = 0;
                    self.isSubmitting = false;                    
                }, 3000);
            }, function(err) {
                self.isSubmitting = false;
                // do error stuff
                console.log(err);
            });
        },
        newRequest: function() {
            var req = {
                meetingId: this.meeting ? this.meeting.meetingId : "",
                firstName: "",
                lastName: "",
                official: false,
                agency: "",
                item: {},
                offAgenda: false,
                subTopic: "",
                stance: "",
                notes: "",
                phone: "",
                email: "",
                address: "",
                timeToSpeak: 0,
                status: "new",
                approvedForDisplay: false
            };
            observable.defineProperty(req, "name", {
                read: function() {
                    if(this.lastName !== "") {
                        return this.firstName + " " + this.lastName;
                    } else {
                        return this.firstName;
                    }
                },
                write: function(value) {
                    var lastSpacePos = value.lastIndexOf(" ");
                    if (lastSpacePos > 0) { // Ignore values with no space character
                        this.firstName = value.substring(0, lastSpacePos); // Update "firstName"
                        this.lastName = value.substring(lastSpacePos + 1); // Update "lastName"
                    } else {
                        this.firstName = value;
                        this.lastName = "";
                    }
                }
            });
            return req;
        },
        cancelRequest: function() {
            this.request = this.newRequest();
            this.step = 0;
        },
        additionalRequest: function() {
            this.isSubmitting = true;
            var self = this;
            http.post(app.apiLocation + "request", this.request).then(function() {
                self.request.item = {};
                self.request.offAgenda = false;
                self.request.subTopic = "";
                self.request.stance = "";
                self.request.notes = "";
                self.step = 0;
                self.isSubmitting = false;                
            }, function(err) {
                self.isSubmitting = false;
                // do error stuff
                console.log(err);
            });
        }
    };

    ret.constituentClick = function() {
        if(this.step === 1) {
            this.nextStep();
        }
        this.request.agency = "";
        return true;
    }.bind(ret);

    ret.nextStep = function() {
        this.step += 1;
    }.bind(ret);

    ret.openItemSelector = function() {
        this.itemSelector = true;
        $(".agendaItems").animate({
            scrollTop: 0
        }, 100);
    }.bind(ret);

    ret.selectItem = function(data) {
        if(data.itemOrder === 0) {
            this.request.offAgenda = true;
            this.request.item = data;
            this.request.timeToSpeak = data.timeToSpeak;
            this.itemSelector = false;
        } else {
            this.request.offAgenda = false;
            this.request.item = data;
            this.request.timeToSpeak = data.timeToSpeak;
            this.itemSelector = false;
        }
    }.bind(ret);

    observable.defineProperty(ret, "displayItem", function() {
        if(this.request.offAgenda === true) {
            return "Off Agenda";
        } else if(this.request.item && this.request.item.itemName) {
            return this.request.item.itemOrder + ": " + this.request.item.itemName;
        } else {
            return "";
        }
    });

    observable.defineProperty(ret, "notesCharsRemaining", function() {
        return 250 - this.request.notes.length;
    });

    observable.defineProperty(ret, "enableNext", function() {
        var step = this.step;
        var name = this.request.name;
        var official = this.request.official;
        var agency = this.request.agency;
        var stance = this.request.stance;

        switch(step) {
        case 0:
            return (name.trim().length > 2);
        case 1:
            return ((official === "official" && agency.trim().length > 2) || (official === "constituent"));
        case 2:
            return (stance !== "" && this.displayItem);
        case 3:
            // Notes required for Off Agenda requests.
            return (this.request.item.itemName !== "Off Agenda" || this.request.notes.length > 2);
        case 5:
            return app.enableReview;
        default:
            return true;
        }
    });

    return ret;
});
