/* global jasmine, describe, beforeEach, it, expect, require */
define(["requestAdmin"], function(RequestAdmin) {
    describe("Request Admin ViewModel functions.", function() {
        "use strict";
        /**
         * get test data
         */
        var testData = {
            meeting: {},
            wallConnected: true,
            connectedAdmins: 1,
            connectedKiosks: 1,
            connectedBoards: 1
        };

        var a = new RequestAdmin();

        describe("Request Admin functions.", function() {
            it("deviceMessage should activate or deactivate the wall for wall device type event.", function() {
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
                a.deviceMessage({
                    deviceType: "wall",
                    event: "connected"
                });
                expect(a.wallConnected).toBe(true);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
                a.deviceMessage({
                    deviceType: "wall",
                    event: "disconnected"
                });
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
            });

            it("deviceMessage should set kiosk count for kiosk device type event.", function() {
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
                a.deviceMessage({
                    deviceType: "kiosk",
                    event: "connected",
                    count: 1
                });
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(1);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
                a.deviceMessage({
                    deviceType: "kiosk",
                    event: "disconnected",
                    count: 0
                });
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
            });

            it("deviceMessage should set admin count for admin device type event.", function() {
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
                a.deviceMessage({
                    deviceType: "admin",
                    event: "connected",
                    count: 1
                });
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(1);
                expect(a.connectedBoards).toBe(0);
                a.deviceMessage({
                    deviceType: "admin",
                    event: "disconnected",
                    count: 0
                });
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
            });

            it("deviceMessage should set board count for board device type event.", function() {
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
                a.deviceMessage({
                    deviceType: "board",
                    event: "connected",
                    count: 1
                });
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(1);
                a.deviceMessage({
                    deviceType: "board",
                    event: "disconnected",
                    count: 0
                });
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
            });

            it("initializeMessage should set all counts and wall status.", function() {
                expect(a.wallConnected).toBe(false);
                expect(a.connectedKiosks).toBe(0);
                expect(a.connectedAdmins).toBe(0);
                expect(a.connectedBoards).toBe(0);
                a.initializeMessage(testData);
                expect(a.wallConnected).toBe(true);
                expect(a.connectedKiosks).toBe(1);
                expect(a.connectedAdmins).toBe(1);
                expect(a.connectedBoards).toBe(1);
            });
        });
    });
});
