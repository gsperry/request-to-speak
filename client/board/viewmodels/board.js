/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "eventHandler"], function(http, app, observable, event) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        requests: [],
        requestList: [],
        requestSort: "",
        totalRemainingTime: 0,
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "board");
            }
        },
        initializeMessage: function(message) {
            if(message.meeting.meetingId !== undefined) {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.requests = message.meeting.requests;
            this.requestList = this.createList(this.requests);
            this.totalRemainingTime = this.requestList.reduce(function(p, c) {
                return p + c.timeRemaining;
            });
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.requests = message.meeting.requests;
            this.requestList = this.createList(this.requests);
            this.totalRemainingTime = this.requestList.reduce(function(p, c) {
                return p + c.timeRemaining;
            });
        },
        requestMessage: function(message) {
            var requests = this.meeting.requests;
            if(message.event === "add") {
                requests.push(message.request);
            } else {
                requests.splice(requests.findIndex(function(r) {
                    return r.requestId === message.request.requestId;
                }), 1);
            }
            this.requestList = this.createList(this.requests);
            this.totalRemainingTime = this.requestList.reduce(function(p, c) {
                return p + c.timeRemaining;
            });
        },
        createList: function(requests) {
            // start with a distinct list of items.
            var allItems = requests.map(function(request) {
                return request.item;
            });
            var items = allItems.filter(function(value, index, self) {
                return self.findIndex(function(i) {
                    return value.itemId === i.itemId;
                }) === index;
            });

            // add requests and sum time to speak
            items.forEach(function(i) {
                i.requests = requests.filter(function(r) {
                    return r.item.itemId === i.itemId;
                });
                i.timeRemaining = i.requests.reduce(function(p, c) {
                    return p.timeToSpeak + c.timeToSpeak;
                });
            });

            return items;
        }
    };

    return ret;
});
