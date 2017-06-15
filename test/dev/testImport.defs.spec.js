/* global jasmine, describe, beforeEach, it, expect, require */
define(["dialog/import"], function(Import) {
    describe("Import ViewModel definitions.", function() {
        "use strict";

        var a = new Import();

        describe("Import definitions.", function() {
            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });

            it("should define meetings as an Array.", function() {
                expect(a.meetings).toBeDefined();
                expect(a.meetings).toEqual(jasmine.any(Array));
            });

            it("should define selectedMeeting", function() {
                expect(a.selectedMeeting).toBeDefined();
            });

            it("should define selectMeeting as a Function.", function() {
                expect(a.selectMeeting).toBeDefined();
                expect(a.selectMeeting).toEqual(jasmine.any(Function));
            });

            it("should define confirmSelection as a Function.", function() {
                expect(a.confirmSelection).toBeDefined();
                expect(a.confirmSelection).toEqual(jasmine.any(Function));
            });

            it("should define closeDialog as a Function.", function() {
                expect(a.closeDialog).toBeDefined();
                expect(a.closeDialog).toEqual(jasmine.any(Function));
            });
        });
    });
});
