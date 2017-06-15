/* global jasmine, describe, beforeEach, it, expect, require */
define(["kiosk"], function(kiosk) {
    describe("Kiosk ViewModel definitions.", function() {
        "use strict";

        // var a = require("kiosk");
        var a = kiosk;

        describe("Kiosk definitions.", function() {
            it("should define isConnected", function() {
                expect(a.isConnected).toBeDefined();
            });

            it("should define isMeetingActive", function() {
                expect(a.isMeetingActive).toBeDefined();
            });

            it("should define step", function() {
                expect(a.step).toBeDefined();
            });

            it("should define request", function() {
                expect(a.request).toBeDefined();
            });

            it("should define meeting", function() {
                expect(a.meeting).toBeDefined();
            });

            it("should define selectedItem", function() {
                expect(a.selectedItem).toBeDefined();
                expect(a.selectedItem).toEqual(jasmine.any(Object));
            });

            it("should define isSubmitting", function() {
                expect(a.isSubmitting).toBeDefined();
            });

            it("should define confirmSubmission.", function() {
                expect(a.confirmSubmission).toBeDefined();
            });

            it("should define messages as an Array", function() {
                expect(a.messages).toBeDefined();
                expect(a.messages).toEqual(jasmine.any(Array));
            });

            it("should define primus", function() {
                expect(a.primus).toBeDefined();
            });

            it("should define attached as a Function", function() {
                expect(a.attached).toBeDefined();
                expect(a.attached).toEqual(jasmine.any(Function));
            });

            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });

            it("should define meetingMessage as a Function.", function() {
                expect(a.meetingMessage).toBeDefined();
                expect(a.meetingMessage).toEqual(jasmine.any(Function));
            });

            it("should define initializeMessage as a Function.", function() {
                expect(a.initializeMessage).toBeDefined();
                expect(a.initializeMessage).toEqual(jasmine.any(Function));
            });

            it("should define submitRequest as a Function.", function() {
                expect(a.submitRequest).toBeDefined();
                expect(a.submitRequest).toEqual(jasmine.any(Function));
            });

            it("should define nextStep as a Function.", function() {
                expect(a.nextStep).toBeDefined();
                expect(a.nextStep).toEqual(jasmine.any(Function));
            });

            it("should define prevStep as a Function.", function() {
                expect(a.prevStep).toBeDefined();
                expect(a.prevStep).toEqual(jasmine.any(Function));
            });

            it("should define submitRequest as a Function.", function() {
                expect(a.submitRequest).toBeDefined();
                expect(a.submitRequest).toEqual(jasmine.any(Function));
            });

            it("should define newRequest as a Function.", function() {
                expect(a.newRequest).toBeDefined();
                expect(a.newRequest).toEqual(jasmine.any(Function));
            });

            it("should define additionalRequest as a Function.", function() {
                expect(a.additionalRequest).toBeDefined();
                expect(a.additionalRequest).toEqual(jasmine.any(Function));
            });
        });

        describe("Request definitions.", function() {
            var r = a.newRequest();

            it("should define firstName", function() {
                expect(r.firstName).toBeDefined();
            });

            it("should define lastName", function() {
                expect(r.lastName).toBeDefined();
            });

            it("should define official", function() {
                expect(r.official).toBeDefined();
            });

            it("should define agency", function() {
                expect(r.agency).toBeDefined();
            });

            it("should define item", function() {
                expect(r.item).toBeDefined();
            });

            it("should define offAgenda", function() {
                expect(r.offAgenda).toBeDefined();
            });

            it("should define subTopic", function() {
                expect(r.subTopic).toBeDefined();
            });

            it("should define stance", function() {
                expect(r.stance).toBeDefined();
            });

            it("should define notes", function() {
                expect(r.notes).toBeDefined();
            });

            it("should define phone", function() {
                expect(r.phone).toBeDefined();
            });

            it("should define email", function() {
                expect(r.email).toBeDefined();
            });

            it("should define address.", function() {
                expect(r.address).toBeDefined();
            });

            it("should define timeToSpeak.", function() {
                expect(r.timeToSpeak).toBeDefined();
            });
        });
    });
});
