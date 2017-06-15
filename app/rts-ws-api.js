/* global module,require*/
/* eslint prefer-spread: "off" */
let logger = null;
let meeting = {};
let displayRequests = [];
let wallSpark = null;
let adminSparks = [];
let kioskSparks = [];
let boardSparks = [];

/**
 * Function to attach to Primus events
 * @param {Primus} primus - The primus instance used for this app.
 */
function setupPrimus(primus) {
    primus.on("connection", function(spark) {
        if(spark.query.clientType) {
            switch(spark.query.clientType) {
            case "kiosk":
                kioskSparks.push(spark);
                notify("admins", {
                    "messageType": "device",
                    "message": {
                        "deviceType": "kiosk",
                        "event": "connected",
                        "count": kioskSparks.length
                    }});
                initializeKiosk(spark);
                break;
            case "wall":
                wallSpark = spark;
                notify("admins", {
                    "messageType": "device",
                    "message": {
                        "deviceType": "wall",
                        "event": "connected"
                    }});
                initializeWall(spark);
                break;
            case "board":
                boardSparks.push(spark);
                notify("admins", {
                    "messageType": "device",
                    "message": {
                        "deviceType": "board",
                        "event": "connected",
                        "count": boardSparks.length
                    }});
                initializeBoard(spark);
                break;
            case "admin":
                adminSparks.push(spark);
                notify("admins", {
                    "messageType": "device",
                    "message": {
                        "deviceType": "admin",
                        "event": "connected",
                        "count": adminSparks.length
                    }});
                initializeAdmin(spark);
                break;
            default:
                // bad client.
            }
            logger.info("New connection.", {
                type: spark.query.clientType,
                identity: spark.id
            });
            spark.on("data", function(message) {
                logger.info("Message received %s.", message);

                if(message == "ping") {
                    primus.write({reply: "pong"});
                }
            });
            spark.on("heartbeat", function() {
                logger.trace("Hearbeat.");
            });
        }
    });

    primus.on("disconnection", function(spark) {
        switch(spark.query.clientType) {
        case "wall":
            if(spark === wallSpark) {
                wallSpark = null;
                notify("admins", {"messageType": "device", "message": {"deviceType": "wall", "event": "disconnected"}});
            } else {
                // wall out of sync!!!
            }
            break;
        case "admin":
            adminSparks = adminSparks.filter(function(adminSpark) {
                return adminSpark.id !== spark.id;
            });
            notify("admins", {
                "messageType": "device",
                "message": {
                    "deviceType": "admin",
                    "event": "disconnected",
                    "count": adminSparks.length
                }});
            break;
        case "kiosk":
            kioskSparks = kioskSparks.filter(function(kioskSpark) {
                return kioskSpark.id !== spark.id;
            });
            notify("admins", {
                "messageType": "device",
                "message": {
                    "deviceType": "kiosk",
                    "event": "disconnected",
                    "count": kioskSparks.length
                }});
            break;
        case "board":
            boardSparks = boardSparks.filter(function(boardSpark) {
                return boardSpark.id !== spark.id;
            });
            notify("admins", {
                "messageType": "device",
                "message": {
                    "deviceType": "board",
                    "event": "disconnected",
                    "count": boardSparks.length
                }});
            break;
        }
    });
}

/**
 * Send data message to all connected admins
 * @param {String} group - group to notify.
 * @param {Message} data - object to send to admin sparks.
 */
function notify(group, data) {
    let sparks = [];
    switch(group) {
    case "wall":
        sparks.push(wallSpark);
        break;
    case "kiosks" :
        sparks = kioskSparks;
        break;
    case "admins":
        sparks = adminSparks;
        break;
    case "boards":
        sparks = boardSparks;
        break;
    case "all":
        sparks.push.apply(sparks, kioskSparks);
        sparks.push.apply(sparks, adminSparks);
        sparks.push.apply(sparks, boardSparks);
        if(wallSpark) {
            sparks.push(wallSpark);
        }
        break;
    case "watchers":
        sparks.push.apply(sparks, adminSparks);
        sparks.push.apply(sparks, boardSparks);
        break;
    }
    sparks.forEach(function(spark) {
        spark.write(data);
    });
}

/**
 *
 * @param {Spark} spark - newly connected admin spark.
 */
function initializeAdmin(spark) {
    logger.debug("Initializing admin.");

    spark.write({
        "messageType": "initialize",
        "message": {
            "meeting": meeting,
            "connectedKiosks": kioskSparks.length,
            "connectedAdmins": adminSparks.length,
            "connectedBoards": boardSparks.length,
            "wallConnected": (wallSpark !== null)
        }
    });
}

/**
 *
 * @param {Spark} spark - newly connected kiosk spark.
 */
function initializeKiosk(spark) {
    logger.debug("Initializing kiosk.");

    spark.write({
        "messageType": "initialize",
        "message": {
            "meetingData": meeting
        }
    });
}

/**
 * initialize wall state.
 */
function initializeWall() {
    logger.debug("Initializing wall.");

    notify("wall", {
        "messageType": "initialize",
        "mesage": {
            "meeting": meeting,
            "requests": displayRequests
        }
    });
}

/**
 * @param {Spark} spark
 * initialize board state.
 */
function initializeBoard(spark) {
    logger.debug("Initializing board.");

    spark.write({
        "messageType": "initialize",
        "message": {
            "meeting": meeting
        }
    });
}

// Public functions

/**
 * Adds a request to the live meeting.
 * @param {Request} request
 * @return {Promise}
 */
function addRequest(request) {
    logger.debug("Adding request.");

    return new Promise(function(fulfill, reject) {
        meeting.requests.push(request);
        notify("watchers", {
            "messageType": "request",
            "message": {
                "event": "add",
                "request": request
            }
        });
        fulfill();
    });
}

/**
 * Adds a request to the live meeting.
 * @param {Request} request
 * @return {Promise}
 */
function updateRequest(request) {
    logger.debug("Updating request.");

    return new Promise(function(fulfill, reject) {
        let old = meeting.requests.findIndex(function(r) {
            return r.requestId === request.requestId;
        });
        meeting.requests.splice(old, 1, request);
    });
}

/**
 * Starts a meeting by sending event to everyone.
 * @param {Meeting} newMeeting
 * @return {Promise}
 */
function startMeeting(newMeeting) {
    logger.debug("Starting meeting.");

    return new Promise(function(fulfill, reject) {
        meeting = newMeeting;

        notify("all", {
            "messageType": "meeting",
            "message": {
                "event": "started",
                "meeting": meeting
            }
        });
        fulfill();
    });
}

/**
 * Ends an active meeting by sending event to everyone.
 */
function endActiveMeeting() {
    logger.debug("Ending active meeting.");

    meeting = {};

    notify("all", {
        "messageType": "meeting",
        "message": {
            "event": "ended"
        }
    });
}

/**
 * Send updated list of requests to the wall
 */
function refreshWall() {
    logger.debug("Refreshing wall.");

    displayRequests = meeting.requests.filter(function(r) {
        r.approvedForDisplay === true;
    });

    notify("wall", {
        "messageType": "refresh",
        "mesage": {
            "meeting": meeting,
            "requests": displayRequests
        }
    });
}

module.exports = function(primus, log) {
    logger = log;

    setupPrimus(primus);

    return {
        version: "1.0",
        addRequest: addRequest,
        updateRequest: updateRequest,
        startMeeting: startMeeting,
        endActiveMeeting: endActiveMeeting,
        refreshWall: refreshWall
    };
};
