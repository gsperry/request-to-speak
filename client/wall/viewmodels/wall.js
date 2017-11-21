/* eslint no-console: "off" */
define(["durandal/app", "eventHandler", "moment"], function(app, event, moment) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        requests: [],
        displayRequests: [],
        messages: [],
        primus: null,
        disconnected: function() {
            location.reload();
        },
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "wall");
            }
        },
        initializeMessage: function(message) {
            if(message.meeting.meetingId !== undefined) {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.requests = message.requests;
            this.setDisplay();
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.requests = [];
            this.setDisplay();
        },
        refreshMessage: function(message) {
            this.requests = message.requests;
            this.setDisplay();
        },
        requestMessage: function(message) {
            switch(message.event) {
            case "remove":
                this.removeFromList(message.requestId);
                break;
            }
        }
    };

    ret.setDisplay = function() {
        this.displayRequests = this.requests.sort(function(a, b) {
            var aVal = (a.status === "active" ? "0" : "1");
            var bVal = (b.status === "active" ? "0" : "1");
            aVal += ("0000" + ((parseInt(a.item.itemOrder) === 0) ?
                1000 : parseInt(a.item.itemOrder)).toString()).slice(-4);
            bVal += ("0000" + ((parseInt(b.item.itemOrder) === 0) ?
                1000 : parseInt(b.item.itemOrder)).toString()).slice(-4);
            aVal += ((a.official) ? "0" : "1");
            bVal += ((b.official) ? "0" : "1");
            aVal += moment(a.dateAdded).valueOf().toString();
            bVal += moment(b.dateAdded).valueOf().toString();

            return parseInt(aVal) - parseInt(bVal);
        }).slice(0, 10);
    };

    ret.removeFromList = function(requestId) {
        var toRemove = this.requests.find(function(r) {
            return r.requestId === parseInt(requestId);
        });
        if(toRemove) {
            this.requests.splice(this.requests.indexOf(toRemove), 1);
        }

        this.setDisplay();
    }.bind(ret);

    return ret;
});
