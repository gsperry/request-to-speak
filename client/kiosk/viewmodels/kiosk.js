/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "eventHandler", "classie"], 
function(http, app, observable, event, classie) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        request: {
            official: ""
        },
        meeting: {},
        selectedItem: {},
        isSubmitting: false,
        messages: [],
        primus: null,
        attached: function() {
				var formWrap = document.getElementById( 'fs-form-wrap' );

				[].slice.call( document.querySelectorAll( 'select.cs-select' ) ).forEach( function(el) {	
					var sfx = new SelectFx( el, {
						stickyPlaceholder: false,
						onChange: function(val){
							document.querySelector('span.cs-placeholder').style.backgroundColor = val;
						}
					});
				} );

				new FForm( formWrap, {
					onReview : function() {
						classie.add( document.body, 'overview' ); 
					}
				} );

            [].slice.call( document.querySelectorAll( 'input.input__field' ) ).forEach( function( inputEl ) {
                // in case the input is already filled..
                if( inputEl.value.trim() !== '' ) {
                    classie.add( inputEl.parentNode, 'input--filled' );
                }

                // events:
                inputEl.addEventListener( 'focus', onInputFocus );
                inputEl.addEventListener( 'blur', onInputBlur );
            } );

            function onInputFocus( ev ) {
                classie.add( ev.target.parentNode, 'input--filled' );
            }

            function onInputBlur( ev ) {
                if( ev.target.value.trim() === '' ) {
                    classie.remove( ev.target.parentNode, 'input--filled' );
                }
            }
            
            $('.showInput').hide();
            $("input[id='q3a']").click(function () {
                $('.showInput').show('fast');
                $('#q3c').prop('required', true);
            });
            $("input[id='q3b']").click(function () {
                $('.showInput').hide('fast');
                $('#q3c').prop('required', false);
            });           
            
            var maxLength = 250;
            $('textarea').keyup(function() {
                var length = $(this).val().length;
                var length = maxLength-length;
                $('#chars').text(length);
            });
        },
        activate: function() {
            this.request = this.newRequest();
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "kiosk");
            }
        },
        meetingMessage: function(message) {
            console.log("Meeting message");
            if(message.event === "started") {
                this.isMeetingActive = true;
                this.meeting = message.meetingData;
                this.request = this.newRequest();
            } else {
                this.isMeetingActive = false;
                this.meeting = {};
                this.request = {};
            }
        },
        initializeMessage: function(message) {
            console.log("Initializing kiosk");
            this.meeting = message.meetingData;
            this.isMeetingActive = message.meetingData.active;
        },
        submitRequest: function() {
            this.isSubmitting = true;
            var self = this;
            http.post(location.href.replace(/[^/]*$/, "") + "request", this.request).then(function() {
                self.isSubmitting = false;
                self.confirmSubmission();
            }, function() {
                // do error stuff
            });
        },
        confirmSubmission: function() {
            // show message for 3 seconds
            this.request = this.newRequest();
        },
        newRequest: function() {
            var req = {
                meetingId: this.meeting.meetingId,
                firstName: "",
                lastName: "",
                official: false,
                agency: "",
                item: "",
                offAgenda: false,
                subTopic: "",
                stance: "",
                notes: "",
                phone: "",
                email: "",
                address: "",
                timeToSpeak: 0
            };
            observable.defineProperty(req, "name", {
                read: function () {
                    return this.firstName + " " + this.lastName;
                },
                write: function (value) {
                    var lastSpacePos = value.lastIndexOf(" ");
                    if (lastSpacePos > 0) { // Ignore values with no space character
                        this.firstName = value.substring(0, lastSpacePos); // Update "firstName"
                        this.lastName = value.substring(lastSpacePos + 1); // Update "lastName"
                    }
                }
            });
            return req;
        },
        additionalRequest: function() {
            this.request.item = "";
            this.request.offAgenda = false;
            this.request.subTopic = "";
            this.request.stance = "";
            this.request.notes = "";
        }
    };
    observable(ret, "selectedItem").subscribe(function(value) {
        if(value !== undefined) {
            this.request.item = value.itemName;
            this.request.timeToSpeak = value.defaultTimeToSpeak;
        }
    }.bind(ret));

    return ret;
});
