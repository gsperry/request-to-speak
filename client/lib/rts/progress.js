/* global $, jQuery */
$(document).ready(function() {
    var controlButton = $("#controlButton");

    $(".increment").click(function() {
        controlButton.progressIncrement();
    });
});

(function($) {
    // Creating a number of jQuery plugins that you can use to
    // initialize and control the progress meters.

    $.fn.progressInitialize = function() {
        // This function creates the necessary markup for the progress meter
        // and sets up a few event listeners.

        // Loop through all the buttons:
        return this.each(function() {
            var button = $(this);
            var progress = 0;

            // Extract the data attributes into the options object.
            // If they are missing, they will receive default values.

            var options = $.extend({
                type: "background-horizontal",
                loading: "Loading...",
                finished: "Done!"
            }, button.data());

            // Add the data attributes if they are missing from the element.
            // They are used by our CSS code to show the messages
            button.attr({"data-loading": options.loading, "data-finished": options.finished});

            // Add the needed markup for the progress bar to the button
            var bar = $("<span class='tz-bar '" + options.type + "'>").appendTo(button);

            // The progress event tells the button to update the progress bar
            button.on("progress", function(e, val, absolute, finish) {
                if (!button.hasClass("in-progress")) {
                    // This is the first progress event for the button (or the
                    // first after it has finished in a previous run). Re-initialize
                    // the progress and remove some classes that may be left.
                    bar.show();
                    progress = 0;
                    button.removeClass("finished").addClass("in-progress");
                }

                // val, absolute and finish are event data passed by the progressIncrement
                // and progressSet methods that you can see near the end of this file.

                if (absolute) {
                    progress = val;
                } else {
                    progress += val;
                }

                if (progress >= 100) {
                    progress = 100;
                }

                if (finish) {
                    button.removeClass("in-progress").addClass("finished");

                    bar.delay(500).fadeOut(function() {
                        // Trigger the custom progress-finish event
                        button.trigger("progress-finish");
                        setProgress(0);
                    });
                }
                setProgress(progress);
            });

/**
 *
 * @param {int} percentage
 */
            function setProgress(percentage) {
                bar.filter(".background-horizontal,.background-bar").width(percentage + "%");
                bar.filter(".background-vertical").height(percentage + "%");
            }
        });
    };

    $.fn.progressIncrement = function(val) {
        val = val || 10;
        var button = this.first();
        button.trigger("progress", [val]);
        return this;
    };
})(jQuery);
