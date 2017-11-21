/* eslint no-console: "off" */
define(["durandal/app", "plugins/observable", "eventHandler", "moment"],
function(app, observable, event, moment) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        messages: [],
        requests: [],
        newRequests: [],
        items: [],
        totalTimeRemaining: 0,
        primus: null,
        disconnected: function() {
            location.reload();
        },
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "board");
            }
        },
        initializeMessage: function(message) {
            if(message.meeting.meetingId !== undefined) {
                this.isMeetingActive = true;
                message.meeting.items.forEach(function(i) {
                    i.requests = []; i.timeRemaining = 0;
                });
                this.items = message.meeting.items.sort(this.itemSort);
                this.newRequests = message.meeting.requests;
                this.requests = message.meeting.requests;
                this.addToList();
            }
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
                message.meeting.items.forEach(function(i) {
                    i.requests = []; i.timeRemaining = 0;
                });
                this.items = message.meeting.items.sort(this.itemSort);
                this.newRequests = message.meeting.requests;
                this.requests = message.meeting.requests;
                this.addToList();
            } else {
                this.isMeetingActive = false;
                this.totalTimeRemaining = 0;
                this.items = [];
                this.requests = [];
                this.newRequests = [];
            }
        },
        requestMessage: function(message) {
            var requests = this.requests;
            if(message.event === "add") {
                requests.push(message.request);
                this.newRequests.push(message.request);
            } else if(message.event === "update") {
                this.updateList(message.request);
            } else {
                var requestId = parseInt(message.requestId);
                this.removeFromList(requestId);
            }
        }
    };

    ret.format = function(date) {
        return moment(date).format("HH:mm:ss A");
    };

    ret.addToList = function() {
        var items = this.items;
        // add new requests
        var self = this;
        this.newRequests.forEach(function(r) {
            var item = items.find(function(i) {
                return i.itemId === r.item.itemId;
            });
            if(item) {
                item.requests.push(r);
                item.requests = item.requests.sort(self.requestSort);
            } else {
                // problem!
            }
        });

        // trunc newMessages array
        this.newRequests = [];
        this.timeTotal();
    }.bind(ret);

    ret.removeFromList = function(requestId) {
        var toRemove = this.requests.find(function(r) {
            return r.requestId === requestId;
        });
        if(toRemove) {
            this.requests.splice(this.requests.indexOf(toRemove), 1);
            var items = this.items;
            // remove removeRequests.
            var item = items.find(function(i) {
                return i.itemId === toRemove.item.itemId;
            });
            if(item) {
                var itemRequest = item.requests.find(function(r) {
                    return r.requestId === requestId;
                });
            }
            if(itemRequest) {
                item.requests.splice(item.requests.findIndex(function(f) {
                    return f.requestId === toRemove.requestId;
                }), 1);
            } else {
                var oldNew = this.newRequests.find(function(r) {
                    return r.requestId === toRemove.requestId;
                });
                if(oldNew) {
                    this.newRequests.splice(this.newRequests.indexOf(oldNew), 1);
                }
            }
        }
        this.timeTotal();
    }.bind(ret);

    ret.updateList = function(updatedRequest) {
        var old = this.requests.find(function(r) {
            return r.requestId === updatedRequest.requestId;
        });

        if(old) {
            this.requests.splice(this.requests.indexOf(old), 1, updatedRequest);
            // remove removeRequests.
            var item = this.items.find(function(i) {
                return i.itemId === ((updatedRequest.item.itemId) && (i.requests.indexOf(old) >= 0));
            });

            // TODO: what if change Item in edit.
            if(item) {
                item.requests.splice(item.requests.findIndex(function(f) {
                    return f.requestId === updatedRequest.requestId;
                }), 1, updatedRequest);
            } else {
                var oldNew = this.newRequests.find(function(r) {
                    return r.requestId === updatedRequest.requestId;
                });
                if(oldNew) {
                    this.newRequests.splice(this.newRequests.indexOf(oldNew), 1, updatedRequest);
                }
            }
            this.timeTotal();
        }
    }.bind(ret);

    ret.timeTotal = function() {
        // sum time to speak
        this.items.forEach(function(i) {
            i.timeRemaining = 0;
            if(i.requests) {
                i.requests.forEach(function(r) {
                    i.timeRemaining += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                });
            }
        });

        this.totalTimeRemaining = this.items.reduce(function(p, c) {
            return (p.timeRemaining === undefined ? p : p.timeRemaining) + c.timeRemaining;
        }, 0);
    }.bind(ret);

    ret.itemSort = function(a, b) {
        var aVal = (parseInt(a.itemOrder) === 0) ? 1000 : parseInt(a.itemOrder);
        var bVal = (parseInt(b.itemOrder) === 0) ? 1000 : parseInt(b.itemOrder);
        return aVal - bVal;
    };

    ret.requestSort = function(a, b) {
        var aVal = ((parseInt(a.item.itemOrder) === 0) ? 1000 : parseInt(a.item.itemOrder)).toString();
        var bVal = ((parseInt(b.item.itemOrder) === 0) ? 1000 : parseInt(b.item.itemOrder)).toString();
        aVal += ((a.official) ? "0" : "1");
        bVal += ((b.official) ? "0" : "1");
        aVal += moment(a.dateAdded).valueOf().toString();
        bVal += moment(b.dateAdded).valueOf().toString();

        return parseInt(aVal) - parseInt(bVal);
    };

    return ret;
});
