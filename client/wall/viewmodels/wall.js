/* eslint no-console: "off" */
define(["durandal/app", "eventHandler", "moment"], function (app, event, moment) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        requests: [],
        items: [],
        displayRequests: [],
        messages: [],
        primus: null,
        selectedSort: "Time Entered",
        disconnected: function () {
            location.reload();
        },
        activate: function () {
            // the router's activator calls this function and waits for it to complete before proceeding
            if (this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "wall");
            }
        },
        initializeMessage: function (message) {
            if (message.meeting.meetingId !== undefined) {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }

            message.meeting.items.forEach(function (i) {
                i.requests = [];
                i.timeRemaining = 0;
                i.displayItemOrder = null;
                i.subItems.forEach(function (si) {
                    si.requests = [];
                    si.timeRemaining = 0;
                    si.displayItemOrder = null;
                });

            });
            this.requests = message.requests;
            this.items = message.meeting.items;
            this.setDisplay();
        },
        meetingMessage: function (message) {
            if (message.event === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.requests = [];
            this.setDisplay();
        },
        refreshMessage: function (message) {
            message.meeting.items.forEach(function (i) {
                i.requests = [];
                i.timeRemaining = 0;
                i.displayItemOrder = null;
                i.subItems.forEach(function (si) {
                    si.requests = [];
                    si.timeRemaining = 0;
                    si.displayItemOrder = null;
                });

            });
            this.requests = message.requests;
            this.items = message.meeting.items;
            this.selectedSort = message.meeting.selectedSort;
            this.setDisplay();
        },
        requestMessage: function (message) {

            switch (message.event) {
                case "remove":
                    this.removeFromList(message.requestId);
                    break;
            }
        }
    };

    ret.setDisplay = function () {
        var items = this.items;
        var sort = this.selectedSort;
        items.forEach(function (i) {
            i.requests = [];
            if (i.subItems && i.subItems.length > 0) {
                i.subItems.forEach(function (si) {
                    si.requests = [];
                });
            }
        });
        var self = this;
        this.requests.forEach(function (r) {

            if (r.subItem) {
                items.forEach(function (i) {
                    var subItem;
                    if (i.subItems && i.subItems.length > 0) {
                        subItem = i.subItems.find(function (si) {
                            return si.subItemId === r.subItem
                        })
                    }
                    if (subItem) {
                        subItem.displayItemOrder = r.item.itemOrder + " - " + subItem.subItemOrder + " : " + subItem.subItemName;
                        subItem.requests.push(r);
                        subItem.requests = subItem.requests.sort(function (a, b) {
                            var aVal = (a.status === "active" ? "0" : "1");
                            var bVal = (b.status === "active" ? "0" : "1");
                            // aVal += ("0000" + ((parseInt(a.item.itemOrder) === 0) ? 1000 : parseInt(a.item.itemOrder)).toString()).slice(-4);
                            // bVal += ("0000" + ((parseInt(b.item.itemOrder) === 0) ? 1000 : parseInt(b.item.itemOrder)).toString()).slice(-4);
                            aVal += ((a.official) ? "0" : "1");
                            bVal += ((b.official) ? "0" : "1");
                            if (sort === "Stance") {
                                aVal += a.stance.charCodeAt(0).toString();
                                bVal += b.stance.charCodeAt(0).toString();
                            }
                            else {
                                aVal += moment(a.dateAdded).valueOf().toString();
                                bVal += moment(b.dateAdded).valueOf().toString();
                            }

                            return parseInt(aVal) - parseInt(bVal);
                        }).slice(0, 13);
                    }

                });
            }
            else if (r.item) {
                var item = items.find(function (i) {
                    return i.itemId === r.item.itemId;
                });

                if (item) {
                    item.displayItemOrder = r.item.itemOrder + " : " + r.item.itemName;
                    item.requests.push(r);
                    item.requests = item.requests.sort(function (a, b) {
                        var aVal = (a.status === "active" ? "0" : "1");
                        var bVal = (b.status === "active" ? "0" : "1");
                        // aVal += ("0000" + ((parseInt(a.item.itemOrder) === 0) ? 1000 : parseInt(a.item.itemOrder)).toString()).slice(-4);
                        // bVal += ("0000" + ((parseInt(b.item.itemOrder) === 0) ? 1000 : parseInt(b.item.itemOrder)).toString()).slice(-4);
                        aVal += ((a.official) ? "0" : "1");
                        bVal += ((b.official) ? "0" : "1");
                        if (sort === "Stance") {
                            aVal += a.stance.charCodeAt(0).toString();
                            bVal += b.stance.charCodeAt(0).toString();
                        }
                        else {
                            aVal += moment(a.dateAdded).valueOf().toString();
                            bVal += moment(b.dateAdded).valueOf().toString();
                        }
                        return parseInt(aVal) - parseInt(bVal);
                    }).slice(0, 13);
                }
            }
            else {
                //no match
            }
        });
    };

    ret.requestSort = function (a, b) {
        var aVal = (a.status === "active" ? "0" : "1");
        var bVal = (b.status === "active" ? "0" : "1");
        aVal += ("0000" + ((a.item.itemName === "Off Agenda") ? 1000 : parseInt(a.item.itemOrder)).toString()).slice(-4);
        bVal += ("0000" + ((b.item.itemName === "Off Agenda") ? 1000 : parseInt(b.item.itemOrder)).toString()).slice(-4);
        aVal += ((a.official) ? "0" : "1");
        bVal += ((b.official) ? "0" : "1");
        aVal += moment(a.dateAdded).valueOf().toString();
        bVal += moment(b.dateAdded).valueOf().toString();

        return parseInt(aVal) - parseInt(bVal);
    };

    ret.itemSort = function (a, b) {
        var c = (a.itemName === "Off Agenda") ? 1000 : parseInt(a.itemOrder);
        var d = (b.itemName === "Off Agenda") ? 1000 : parseInt(b.itemOrder);
        return c - d;
    };

    ret.removeFromList = function (requestId) {
        let old;
        this.items.forEach(function (i) {
            if (i.subItems && i.subItems.length > 0) {
                i.subItems.forEach(function (si) {
                    if (si.requests && si.requests.length > 0) {
                        old = si.requests.find(function (r) {
                            return (r.requestId == requestId);
                        });

                        if (old) {
                            si.requests.splice(si.requests.indexOf(old), 1);
                        }
                    }
                }
                );
            }

            if (!old && i.requests && i.requests.length > 0) {
                old = i.requests.find(function (r) {
                    return (r.requestId == requestId);
                });

                if (old) {
                    i.requests.splice(i.requests.indexOf(old), 1);
                }
            }

        }
        );



        var toRemove = this.requests.find(function (r) {
            return (r.requestId == requestId);
        });
        if (toRemove) {
            this.requests.splice(this.requests.indexOf(toRemove), 1);
        }

        this.setDisplay();
    }.bind(ret);

    return ret;
});
