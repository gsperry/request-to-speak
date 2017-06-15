/* global module,require*/

// Solr Client
let solr = require("solr-client");
let uuid = require("uuid/v4");
let client = null;
let logger = null;

/**
 * adds a new meeting to the data store.
 * @param {Meeting} meeting
 * @return {Promise}
 */
function addMeeting(meeting) {
    var docs = [];
    var id = uuid();
    meeting.items.forEach(function(item) {
        item.type = "item";
        item.meetingId = id,
        docs.push(item);
    });
    meeting.id = id;
    meeting.type = "meeting";
    meeting.status = "new";
    delete meeting.items;
    docs.push(meeting);
    return new Promise(function(fulfill, reject) {
        client.add(docs, function(err, obj) {
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info(obj);
                client.softCommit(function(err, res) {
                    if(err) {
                        logger.error(err);
                    } else {
                        logger.info(res);
                    }
                    fulfill(id);
                });
            }
        });
    });
}

/**
 * sets the meeting started flag in the data store.
 * @param {Meeting} meeting
 * @return {Promise}
 */
function startMeeting(meeting) {
    delete meeting.items;
    meeting.status = "started";
    meeting._version_ = 1;
    return new Promise(function(fulfill, reject) {
        client.add(meeting, function(err, obj) {
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info(obj);
                client.softCommit(function(err, res) {
                    if(err) {
                        logger.error(err);
                    } else {
                        logger.info(res);
                    }
                    fulfill(obj);
                });
            }
        });
    });
}
/**
 * retrieve meetings from RTS database
 *@return {Promise}
 */
function getMeetings() {
    return new Promise(function(fulfill, reject) {
        let query = client.createQuery()
            .q({type: "meeting"})
            .start(0)
            .rows(100);
        client.search(query, function(err, obj) {
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info(obj.response.docs);
                fulfill(obj.response.docs);
            }
        });
    });
}

/**
 * @return {Promise}
 */
function getActiveMeeting() {
    return new Promise(function(fulfill, reject) {
        let query = client.createQuery()
            .q({type: "meeting", status: "started"})
            .start(0)
            .rows(10);
        client.search(query, function(err, obj) {
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                if(obj.response.docs.length > 0) {
                    let meeting = obj.response.docs[0];
                    let mtgQuery = client.createQuery()
                        .q({meetingId: meeting.id})
                        .start(0)
                        .rows(500);
                    client.search(mtgQuery, function(err, resp) {
                        if(err) {
                            logger.error(err);
                            reject(err);
                        } else {
                            meeting.items = [];
                            meeting.items.push(...resp.response.docs.filter(function(item) {
                                return item.type === "item";
                            }));
                            meeting.requests = [];
                            meeting.requests.push(...resp.response.docs.filter(function(request) {
                                return request.type === "request";
                            }));
                            fulfill(meeting);
                        }
                    });
                } else {
                    logger.info("No active meeting.");
                    fulfill({});
                }
            }
        });
    });
}

/**
 * Insert new request into database.
 * @param {Request} request
 * @return {Promise}
 */
function addRequest(request) {
    request.type = "request";
    // for now just storing the id.
    var item = request.item;
    request.item = item.itemId;

    return new Promise(function(fulfill, reject) {
        client.add(request, function(err, obj) {
            request.item = item;
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info(obj);
                client.softCommit(function(err, res) {
                    if(err) {
                        logger.error(err);
                    } else {
                        logger.info(res);
                    }
                    fulfill(obj);
                });
            }
        });
    });
}

module.exports = function(config, log) {
    logger = log;

    client = solr.createClient(config);
    client.autoCommit = true;

    return {
        version: "1.0",
        dbType: "Apache Solr",
        addMeeting: addMeeting,
        addRequest: addRequest,
        getMeetings: getMeetings,
        getActiveMeeting: getActiveMeeting,
        startMeeting: startMeeting
    };
};
