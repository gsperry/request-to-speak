/* global jasmine, describe, beforeEach, it, expect, require */
define(["kiosk", "plugins/http"], function(kiosk, http) {
    describe("Kiosk ViewModel functions.", function() {
        "use strict";

        var requestData = {
            firstName: "John",
            lastName: "Doe",
            official: true,
            agency: "USA",
            item: "1",
            offAgenda: true,
            subTopic: "Homelessness",
            stance: "In Support",
            notes: "I'm in support of this.",
            phone: "916-555-1234",
            email: "johndoe@gmail.com",
            address: "123 A st Sacramento CA, 95811",
            timeToSpeak: 3
        };

        var activeMeetingData = {
            event: "started",
            meetingData: {
                meetingId: 12,
                meetingName: "The first one",
                confirmationDuration: 5,
                items: [
                    {
                        itemId: "100",
                        itemName: "1",
                        defaultTimeToSpeak: 2
                    }
                ]
            }
        };

        var endedMeetingData = {
            event: "ended",
            meetingData: {
                meetingId: 12
            }
        };

        var a = require("kiosk");

        describe("Kiosk functions.", function() {
            it("meetingMessage should set proper values for active meeting.", function() {
                a.meetingMessage(activeMeetingData);
                expect(a.meeting.meetingId).toBe(12);
                expect(a.meeting.meetingName).toBe("The first one");
                expect(a.meeting.confirmationDuration).toBe(5);
                expect(a.meeting.items.length).toBe(1);
                expect(a.isMeetingActive).toBe(true);
            });

            it("meetingMessage should set proper values for ended meeting.", function() {
                a.meetingMessage(endedMeetingData);
                expect(a.meeting.meetingId).toBe(12);
                expect(a.request).toEqual(a.newRequest());
                expect(a.isMeetingActive).toBe(false);
            });

            it("additionalRequest should clear specific values for additional request.", function() {
                a.request = requestData;
                a.additionalRequest();
                expect(a.request.firstName).toBe("John");
                expect(a.request.lastName).toBe("Doe");
                expect(a.request.official).toBe(true);
                expect(a.request.agency).toBe("USA");
                expect(a.request.item).toEqual({});
                expect(a.request.offAgenda).toBe(false);
                expect(a.request.subTopic).toBe("");
                expect(a.request.stance).toBe("");
                expect(a.request.notes).toBe("");
                expect(a.request.phone).toBe("916-555-1234");
                expect(a.request.email).toBe("johndoe@gmail.com");
                expect(a.request.address).toBe("123 A st Sacramento CA, 95811");
                expect(a.request.timeToSpeak).toBe(3);
            });
        });
        describe("Request submission.", function() {
            var u;
            var r;
            var c;
            beforeAll(function() {
                spyOn(http, "post").and.callFake(function(url, request) {
                    u = url;
                    r = request;
                    return {
                        then: function(cb) {
                            c = cb;
                        }
                    };
                });
                spyOn(a, "confirmSubmission");
            });

            it("submitRequest should post request object to server.", function() {
                a.request = a.newRequest();
                a.submitRequest();
                expect(http.post).toHaveBeenCalled();
                expect(u).toBe(location.href.replace(/[^/]*$/, "") + "request");
                expect(r).toBe(a.request);
                expect(a.isSubmitting).toBe(true);
            });

            it("should show confirmation and set up the kiosk after submission.", function() {
                c();
                expect(a.isSubmitting).toBe(false);
            });
        });
    });
});
