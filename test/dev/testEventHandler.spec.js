/* global jasmine, describe, beforeEach, it, expect, require */
define(["eventHandler"], function(event) {
    describe("eventHandler Primus features.", function() {
        "use strict";
        var a = event;
        var p = {
            handlers: []
        };
        var v = {
            isConnected: false,
            messsages: [],
            primus: null,
            initializeMessage: function() {},
            deviceMessage: function() {},
            meetingMessage: function() {},
            requestMessage: function() {},
            refreshMessage: function() {}
        };
        p.on = function(name, cb) {
            this.handlers.push({name: name, cb: cb});
        }.bind(p);

        describe("eventHandler attach primus calls.", function() {
            beforeAll(function() {
                spyOn(a, "createPrimus").and.callFake(function(url) {
                    return p;
                });

                spyOn(p, "on").and.callThrough();

                a.setupPrimus(v, "");
            });
            afterAll(function() {
                a.primus = null;
                p.handlers = [];
            });

            it("creates a useful Primus", function() {
                expect(v.primus).toEqual(jasmine.any(Object));
                expect(v.primus.on).toEqual(jasmine.any(Function));
            });

            it("calls the on function 6 times.", function() {
                expect(v.primus.on.calls.count()).toBe(6);
                expect(p.handlers.length).toBe(6);
            });

            it("registers proper functionality on open", function() {
                var open = p.handlers[0];
                expect(open.name).toBe("open");
                v.isConnected = false;
                open.cb();
                expect(v.isConnected).toBe(true);
            });

            it("registers proper functionality on reconnect", function() {
                var reconnect = p.handlers[2];
                expect(reconnect.name).toBe("reconnect");
                v.isConnected = true;
                reconnect.cb("");
                expect(v.isConnected).toBe(false);
            });

            it("registers proper functionality on reconnected", function() {
                var reconnected = p.handlers[3];
                expect(reconnected.name).toBe("reconnected");
                v.isConnected = false;
                reconnected.cb("");
                expect(v.isConnected).toBe(true);
            });

            it("registers proper functionality on end", function() {
                var end = p.handlers[4];
                expect(end.name).toBe("end");
                v.isConnected = true;
                end.cb();
                expect(v.isConnected).toBe(false);
            });
        });
        describe("eventHandler attach data function.", function() {
            beforeEach(function() {
                spyOn(a, "createPrimus").and.callFake(function(url) {
                    return p;
                });

                spyOn(p, "on").and.callThrough();
                spyOn(v, "initializeMessage");
                spyOn(v, "deviceMessage");
                spyOn(v, "meetingMessage");
                spyOn(v, "requestMessage");
                spyOn(v, "refreshMessage");

                a.setupPrimus(v, "");
            });
            afterEach(function() {
                a.primus = null;
                p.handlers = [];
            });

            it("registers functionality for initialize messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "initialize",
                    message: {}
                });
                expect(v.initializeMessage).toHaveBeenCalled();
            });

            it("registers functionality for device messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "device",
                    message: {}
                });
                expect(v.deviceMessage).toHaveBeenCalled();
            });

            it("registers functionality for meeting messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "meeting",
                    message: {}
                });
                expect(v.meetingMessage).toHaveBeenCalled();
            });

            it("registers functionality for request messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "request",
                    message: {}
                });
                expect(v.requestMessage).toHaveBeenCalled();
            });

            it("registers functionality for refresh messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "refresh",
                    message: {}
                });
                expect(v.refreshMessage).toHaveBeenCalled();
            });
        });
    });
});
