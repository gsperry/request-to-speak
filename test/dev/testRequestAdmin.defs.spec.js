/* global jasmine, describe, beforeEach, it, expect, require */
define(["requestAdmin"], function(RequestAdmin) {
    describe("Request Admin ViewModel definitions.", function() {
        "use strict";

        var a = new RequestAdmin();

        describe("Request Admin definitions.", function() {
            it("should define isConnected", function() {
                expect(a.isConnected).toBeDefined();
            });

            it("should define isMeetingActive", function() {
                expect(a.isMeetingActive).toBeDefined();
            });

            it("should define messages as an Array", function() {
                expect(a.messages).toBeDefined();
                expect(a.messages).toEqual(jasmine.any(Array));
            });

            it("should define meeting", function() {
                expect(a.meeting).toBeDefined();
            });

            it("should define wallConnected", function() {
                expect(a.wallConnected).toBeDefined();
            });

            it("should define connectedKiosks", function() {
                expect(a.connectedKiosks).toBeDefined();
            });

            it("should define connectedAdmins", function() {
                expect(a.connectedAdmins).toBeDefined();
            });

            it("should define connectedBoards", function() {
                expect(a.connectedBoards).toBeDefined();
            });

            it("should define primus", function() {
                expect(a.primus).toBeDefined();
            });

            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });

            it("should define editRequest as a Function.", function() {
                expect(a.editRequest).toBeDefined();
                expect(a.editRequest).toEqual(jasmine.any(Function));
            });

            it("should define endMeeting as a Function.", function() {
                expect(a.endMeeting).toBeDefined();
                expect(a.endMeeting).toEqual(jasmine.any(Function));
            });

            it("should define canDeactivate as a Function.", function() {
                expect(a.canDeactivate).toBeDefined();
                expect(a.canDeactivate).toEqual(jasmine.any(Function));
            });

            it("should define deviceMessage as a Function.", function() {
                expect(a.deviceMessage).toBeDefined();
                expect(a.deviceMessage).toEqual(jasmine.any(Function));
            });

            it("should define meetingMessage as a Function.", function() {
                expect(a.meetingMessage).toBeDefined();
                expect(a.meetingMessage).toEqual(jasmine.any(Function));
            });

            it("should define requestMessage as a Function.", function() {
                expect(a.requestMessage).toBeDefined();
                expect(a.requestMessage).toEqual(jasmine.any(Function));
            });

            it("should define initializeMessage as a Function.", function() {
                expect(a.initializeMessage).toBeDefined();
                expect(a.initializeMessage).toEqual(jasmine.any(Function));
            });
        });
    });
});
