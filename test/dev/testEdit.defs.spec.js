/* global jasmine, describe, beforeEach, it, expect, require */
define(["dialog/edit"], function(Edit) {
    describe("Edit ViewModel definitions.", function() {
        "use strict";

        var a = new Edit();

        describe("Edit definitions.", function() {
            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });

            it("should define request", function() {
                expect(a.request).toBeDefined();
            });

            it("should define save as a Function.", function() {
                expect(a.save).toBeDefined();
                expect(a.save).toEqual(jasmine.any(Function));
            });

            it("should define closeDialog as a Function.", function() {
                expect(a.closeDialog).toBeDefined();
                expect(a.closeDialog).toEqual(jasmine.any(Function));
            });
        });
    });
});
