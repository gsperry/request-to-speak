/* global module,require*/

// SQL Connection
let sql = require("mssql");
let config = null;
let logger = null;
let pool = null;
let moment = require("moment");

/**
 * initialize SQL connection.
 * @return {Promise}
 */
function setupSql() {
    return new Promise(function (fulfill, reject) {
        pool = new sql.ConnectionPool(config).connect().then(function (p) {
            logger.debug("RTS DB Connected.");
            pool = p;
            pool.on("error", function (err) {
                logger.error(err);
            });
            fulfill();
        }, function (err) {
            logger.error(err);
            reject(err);
        });
    });
}

/**
 * Adds a meeting to the RTS DB.
 * @param {meeting} meeting
 * @return {Promise}
 */
function addMeeting(meeting) {
    return new Promise(function (fulfill, reject) {

        logger.debug("Meeting object to add", meeting);
        let request = pool.request();

        request.input("sireId", meeting.sireId || "");
        request.input("meetingName", meeting.meetingName);
        request.input("meetingDate", sql.DateTime, new Date(moment(meeting.meetingDate, "MMM Do YYYY").valueOf()));
        request.input("status", "new");
        request.output("id");
        request.execute("InsertMeeting").then(function (result) {
            logger.debug("Commit result.", result);
            let meetingId = result.returnValue;
            let transaction = new sql.Transaction(pool);
            transaction.begin().then(function () {
                let p = Promise.resolve();

                meeting.items.forEach(function (item) {
                    p = p.then(function (ir) {
                        return itemRequest(meetingId, item, transaction);
                    }, function (err) {
                        logger.debug("error", err);
                        transaction.rollback().then(function () {
                            reject(err);
                        }, function () {
                            reject(err);
                        });
                    });
                });
                p.then(function (ir) {
                    transaction.commit().then(function () {
                        meeting.meetingId = meetingId;
                        fulfill(meeting);
                    }, function (err) {
                        reject(err);
                    });
                });
            });
        }).catch(function (err) {
            logger.error("Error in stored procedure." + err);
            reject(err);
        });
    });
}

/**
 * Creates a mssql.request for an item
 * @param {String} meetingId
 * @param {Object} item
 * @param {Object} transaction
 * @return {Request}
 */
function itemRequest(meetingId, item, transaction) {
    let request = new sql.Request(transaction);

    request.input("meetingId", meetingId);
    request.input("itemOrder", item.itemOrder);
    request.input("itemName", item.itemName);
    request.input("timeToSpeak", 2);
    request.output("id");
    return request.execute("InsertItem");
}


/**
 * Creates a mssql.request for an sub item
 * @param {String} meetingId
 * @param {Object} item
 * @param {Object} transaction
 * @return {Request}
 */
function subItemRequest(meetingId, subItem, transaction) {
    let request = new sql.Request(transaction);

    request.input("meetingId", meetingId);
    request.input("subItemOrder", subItem.subItemOrder);
    request.input("subItemName", subItem.subItemName);
    request.input("timeToSpeak", 2);
    request.input("itemId", subItem.itemId);
    request.output("id");
    return request.execute("InsertSubItem");
}

/**
 * returns information on an active meeting
 * @return {Promise}
 */
function getActiveMeeting() {
    return new Promise(function (fulfill, reject) {
        let query = "SELECT meetingId, sireId, meetingName, meetingDate, status FROM Meeting WHERE status = 'started'";
        logger.debug("Statement: " + query);

        let masterRequest = pool.request();
        //1
        masterRequest.query(query).then(function (result) {
            logger.debug("Active meeting query result.", result.recordset);
            if (result.recordset.length === 0) {
                fulfill();
            } else if (result.recordset.length === 1) {
                let meeting = result.recordset[0];
                logger.debug("There is an active meeting: " + meeting.meetingId);
                meeting.requests = [];
                let requestQuery = "SELECT meetingId, requestId, dateAdded, firstName, lastName, official, agency, " +
                    "item, offAgenda, subTopic, stance, notes, phone, email, address, timeToSpeak, status, subItem," +
                    "approvedForDisplay FROM Request WHERE meetingId = @meetingId";
                logger.debug("Statement: " + query);
                let requestRequest = pool.request();

                requestRequest.input("meetingId", meeting.meetingId);
                //2
                requestRequest.query(requestQuery).then(function (requestResult) {
                    logger.debug("Active meeting requests result.", requestResult.recordset);
                    requestResult.recordset.forEach(function (req) {
                        meeting.requests.push(req);
                    });
                    meeting.items = [];
                    let itemQuery = "SELECT i.meetingId, i.itemId, i.itemOrder, i.itemName, i.timeToSpeak FROM " +
                        "Item i WHERE meetingId = @meetingId ORDER BY i.itemOrder";
                    logger.debug("Item statement: " + itemQuery);
                    // let itemRequest = pool.request();
                    // itemRequest.input("meetingId", meeting.meetingId);
                    //3
                    requestRequest.query(itemQuery).then(function (itemResult) {


                        logger.debug("Item query result.", itemResult.recordset);

                        itemResult.recordset.forEach(function (item) {
                            meeting.items.push(item);
                        });

                        let subItemQuery = "SELECT si.meetingId,si.subItemId, si.itemId, si.subItemOrder, si.subItemName, si.timeToSpeak FROM Item i " +
                            "INNER JOIN SubItem si ON i.itemId = si.itemId where si.meetingId = @meetingId ORDER BY si.subItemOrder";

                        logger.debug("Sub Item statement: " + subItemQuery);

                        //  let subitemRequest = pool.request();

                        masterRequest.input("meetingId", meeting.meetingId);
                        //4
                        masterRequest.query(subItemQuery).then(function (subItemResult) {

                            logger.debug("sub item new", subItemResult);

                            if (subItemResult.recordset)
                                meeting.items.forEach(function (item) {
                                    item.subItems = [];
                                    item.subItems = subItemResult.recordset.filter(function (subItem) {
                                        return subItem.itemId === item.itemId;
                                    });
                                });

                            meeting.requests.forEach(function (req) {
                                req.item = meeting.items.find(function (item) {
                                    return item.itemId === req.item;
                                });
                            });
                            logger.debug("meeting meeting meeting", meeting);
                            fulfill(meeting);
                        });



                    }, function (err) {
                        logger.error("Item query error.", err);
                        reject(err);
                    });

                }, function (err) {
                    logger.error("Error getting active meeting requests.", err);
                    reject(err);
                });
            } else {
                logger.error("More than one active meeting.");
                reject(result.recordset);
            }

        }, function (err) {
            logger.error("Query error: " + err);
            reject(err);
        });
    });

    // // The pool may not be there. If it isn't, just chain to the promise.
    // if (pool.then !== undefined) {
    //     return pool.then(function () {
    //         return new Promise(doQuery);
    //     });
    // } else {
    //     return new Promise(doQuery);
    // }
}

/**
 * @param {Object} filter
 * @return {Promise}
 */
function getMeetings(filter) {
    logger.debug(filter);
    return new Promise(function (fulfill, reject) {
        let request = pool.request();
        let meetingQuery = "SELECT meetingId, sireId, meetingName, meetingDate, status FROM Meeting";

        if (filter) {
            logger.debug("Adding WHERE");
            meetingQuery += " WHERE ";
            let where = "";
            if (filter.meetingId) {
                logger.debug("Adding for specific meeting");
                where += " meetingId = @meetingId";
                request.input("meetingId", filter.meetingId);
            }
            if (filter.status) {
                logger.debug("Adding for specific status");
                where += " status = @status";
                request.input("status", filter.status);
            }
            if (filter.meetingDate) {
                logger.debug("Adding for date range");
                if (where !== "") {
                    where += " OR ";
                }
                if (filter.meetingDate.gt) {
                    where += " meetingDate > @meetingDate";
                    request.input("meetingDate", sql.DateTime,
                        new Date(moment(filter.meetingDate.gt, "MMM Do YYYY").valueOf()));
                }
            }
            meetingQuery += where;
        }

        logger.debug("Meeting statement: " + meetingQuery);

        request.query(meetingQuery).then(function (meetingResult) {
            logger.debug("Meeting query result.", meetingResult.recordset);
            let itemQuery = "SELECT i.meetingId, i.itemId, i.itemOrder, i.itemName, i.timeToSpeak FROM Meeting m " +
                "INNER JOIN Item i ON m.meetingId = i.meetingId ORDER BY i.itemOrder";
            logger.debug("Item statement: " + itemQuery);

            pool.request().query(itemQuery).then(function (itemResult) {

                logger.debug("Item query result.", itemResult.recordset);

                let meetings = [];

                meetingResult.recordset.forEach(function (meeting) {

                    meeting.items = itemResult.recordset.filter(function (item) {
                        return item.meetingId === meeting.meetingId;
                    });

                    meetings.push(meeting);
                });


                let subItemQuery = "SELECT si.meetingId, si.itemId, si.subItemOrder, si.subItemName, si.timeToSpeak FROM Item i " +
                    "INNER JOIN SubItem si ON i.itemId = si.itemId ORDER BY si.subItemOrder";

                logger.debug("sub item query", subItemQuery);

                request.query(subItemQuery).then(function (subItemResult) {

                    logger.debug("sub item new", subItemResult);
                    logger.debug("meetings object", meetings);

                    if (subItemResult.recordset)
                        meetings.forEach(function (meeting) {
                            meeting.items.forEach(function (item) {
                                item.subItems = subItemResult.recordset.filter(function (subItem) {
                                    return subItem.itemId === item.itemId;
                                });

                            });
                        });

                    if (filter.meetingId && meetings.length > 0) {
                        fulfill(meetings[0]);
                    } else {
                        fulfill(meetings);
                    }


                }, function (err) {
                    logger.error("Item query error.", err);
                    reject(err);
                });
            }, function (err) {
                logger.error("Meeting query error.", err);
                reject(err);
            });
        });
    });
}

/**
 * set meeting status to started.
 * @param {Meeting} meetingId
 * @return {Promise}
 */
function startMeeting(meetingId) {
    return updateMeetingStatus(meetingId, "started");
}

/**
 * set meeting status to ended.
 * @param {String} meetingId
 * @return {Promise}
 */
function endMeeting(meetingId) {
    return updateMeetingStatus(meetingId, "ended");
}

/**
 * utility function to update meeting status
 * @param {String} meetingId
 * @param {Meeting} meeting
 * @return {Promise}
 */
function updateMeeting(meetingId, meeting) {
    return new Promise(function (fulfill, reject) {
        let transaction = new sql.Transaction(pool);
        transaction.begin().then(function () {

            let request = new sql.Request(transaction);
            request.input("meetingId", meetingId);
            request.input("meetingName", meeting.meetingName);
            request.input("meetingDate", sql.DateTime, new Date(moment(meeting.meetingDate, "MMM Do YYYY").valueOf()));
            // request.input("tvpItems", tvp);
            // //Raj
            // request.input("tvpSubItems", tvpSi);
            logger.debug("Calling UpdateItems");
            request.execute("UpdateMeeting").then(function () {



                meeting.items.forEach(function (i) {
                    var newItem = {
                        meetingId: meetingId,
                        itemName: i.itemName,
                        itemOrder: i.itemOrder,
                        timeToSpeak: i.timeToSpeak,
                    };

                    var itemId = addItem(newItem).then(function (result) {
                        logger.debug("newID", result);

                        if (i.subItems) {
                            i.subItems.forEach(function (si) {
                                var newSubItem = {
                                    meetingId: meetingId,
                                    itemId: result,
                                    subItemName: si.subItemName,
                                    subItemOrder: si.subItemOrder,
                                    timeToSpeak: si.timeToSpeak,
                                };
                                addSubItem(newSubItem);
                            })
                        }
                    });
                });


                transaction.commit().then(function (result) {
                    logger.debug("Update meeting status commit result.", result);
                    fulfill();

                }).catch(function (err) {
                    logger.error("Error in Transaction Commit." + err);
                    reject(err);
                });
            }).catch(function (err) {
                logger.error("Error in SP execution." + err);
                reject(err);
            });
        }, function (err) {
            logger.error(err);
            reject(err);
        });
    });
}

/**
 * utility function to update meeting status
 * @param {string} meetingId
 * @param {string} status
 * @return {Promise}
 */
function updateMeetingStatus(meetingId, status) {
    return new Promise(function (fulfill, reject) {
        let transaction = new sql.Transaction(pool);
        transaction.begin().then(function () {
            let request = new sql.Request(transaction);

            request.input("status", status);
            request.input("meetingId", meetingId);
            let query = "UPDATE Meeting set status = @status where meetingId = @meetingId";
            logger.debug("Statement: " + query);
            request.query(query).then(function () {
                transaction.commit().then(function (recordSet) {
                    logger.debug("Update meeting status commit result.", recordSet);
                    fulfill();
                }).catch(function (err) {
                    logger.error("Error in Transaction Commit." + err);
                    reject(err);
                });
            }).catch(function (err) {
                logger.error("Error in Transaction Begin." + err);
                reject(err);
            });
        }).catch(function (err) {
            logger.error(err);
            reject(err);
        });
    });
}

/**
 * Delete a meeting in the database.
 * @param {String} meetingId
 * @return {Promise}
 */
function deleteMeeting(meetingId) {
    return new Promise(function (fulfill, reject) {
        // Query
        let request = pool.request();

        request.input("meetingId", meetingId);
        request.query("Delete from meeting where meetingId = @meetingId").then(function (result) {
            logger.debug("Meeting deleted.", result);
            fulfill();
        }).catch(function (err) {
            logger.error("Error executing delete query.", err);
            reject(err);
        });
    });
}

/**
 * Returns a specific request.
 * @param {String} requestId
 * @return {Promise}
 */
function getRequest(requestId) {
    return new Promise(function (fulfill, reject) {
        let request = pool.request();
        let requestQuery = "SELECT meetingId, requestId, dateAdded, firstName, lastName, official, agency, " +
            "item, subTopic, stance, notes, phone, email, address, timeToSpeak, status, " +
            "approvedForDisplay FROM Request WHERE status NOT IN('deleted','removed')";

        if (requestId) {
            logger.debug("Adding for specific request");
            requestQuery += " AND requestId = @requestId";
            request.input("requestId", requestId);
        }

        logger.debug("Request statement: " + requestQuery);

        request.query(requestQuery).then(function (requestResult) {
            let itemRequest = pool.request();
            logger.debug("Request query result.", requestResult.recordset);
            let itemQuery = "SELECT i.meetingId, i.itemId, i.itemOrder, i.itemName, i.timeToSpeak FROM Request r " +
                "INNER JOIN Item i ON r.item = i.itemId";

            if (requestId) {
                logger.debug("Adding for specific request");
                requestQuery += " WHERE r.requestId = @requestId";
                itemRequest.input("requestId", requestId);
            }

            logger.debug("Item statement: " + itemQuery);
            itemRequest.query(itemQuery).then(function (itemResult) {
                logger.debug("Item query result.", itemResult.recordset);
                let requests = [];
                requestResult.recordset.forEach(function (request) {
                    request.item = itemResult.recordset.filter(function (item) {
                        return item.itemId === request.item;
                    })[0];
                    requests.push(request);
                });
                if (requestId && requests.length > 0) {
                    fulfill(requests[0]);
                } else {
                    fulfill(requests);
                }
            }, function (err) {
                logger.error("Item query error.", err);
                reject(err);
            });
        }, function (err) {
            logger.error("Request query error.", err);
            reject(err);
        });
    });
}

/**
 * Returns a specific request.
 * @param {String} meetingId
 * @return {Promise}
 */
function getRequests(meetingId) {
    return new Promise(function (fulfill, reject) {
        let request = pool.request();
        let requestQuery = "SELECT requestId, item.itemOrder,SubItem.subItemOrder, item.itemName,SubItem.subItemName,"+
         "DATEADD(hh, DATEDIFF(hh, getutcdate(), getdate()), Request.dateAdded) as dateAdded, firstName, lastName, " +
        "case when official = 1 then 'Yes' else 'No' End as official, agency, offAgenda, subTopic, stance," +
        "case when Request.status = 'removed' then 'Yes' else 'No' End as concluded ," +
        "notes, phone, email, address, Request.timeToSpeak, " +
        "Request.status, approvedForDisplay FROM Request INNER JOIN Item ON Request.item = Item.itemId " +
        "LEFT JOIN SubItem ON Request.subItem = SubItem.subItemId "+
        "INNER JOIN Meeting on Request.meetingId = Meeting.meetingId WHERE Meeting.meetingId = @meetingId " +
        "ORDER BY Item.itemOrder asc,SubItem.subItemOrder asc, official desc,  Request.dateAdded asc";

        logger.debug("Request statement: " + requestQuery);
        request.input("meetingId", meetingId);

        request.query(requestQuery).then(function (requestResult) {
            fulfill(requestResult.recordset);
        }, function (err) {
            logger.error("Request query error.", err);
            reject(err);
        });
    });
}

/**
 * Insert new request into database.
 * @param {Request} newRequest
 * @return {Promise}
 */
function addRequest(newRequest) {
    return new Promise(function (fulfill, reject) {
        // Query

        let request = pool.request();

        request.input("meetingId", newRequest.meetingId);
        request.input("firstName", newRequest.firstName);
        request.input("lastName", newRequest.lastName);
        request.input("official", newRequest.official);
        request.input("agency", newRequest.agency);
        request.input("item", newRequest.item.itemId);
        request.input("offAgenda", newRequest.offAgenda);
        request.input("subTopic", newRequest.subTopic);
        request.input("stance", newRequest.stance);
        request.input("notes", newRequest.notes);
        request.input("phone", newRequest.phone);
        request.input("email", newRequest.email);
        request.input("address", newRequest.address);
        request.input("timeToSpeak", newRequest.timeToSpeak);
        request.input("status", newRequest.status);
        if (newRequest.item.subItem) {
            request.input("subItem", newRequest.item.subItem.subItemId);
        }
        else {
            request.input("subItem", null);
        }
        request.output("id");
        request.execute("InsertRequest").then(function (result) {
            logger.debug("New request inserted.", result);
            fulfill(result.returnValue);
        }).catch(function (err) {
            logger.error("Error in calling insert stored procedure.", err);
            reject(err);
        });
    });
}

/**
 * Update a request in the database.
 * @param {Request} updateRequest
 * @return {Promise}
 */
function updateRequest(updateRequest) {
    return new Promise(function (fulfill, reject) {
        // Query
        let request = pool.request();

        request.input("requestId", updateRequest.requestId);
        request.input("firstName", updateRequest.firstName);
        request.input("lastName", updateRequest.lastName);
        request.input("official", updateRequest.official);
        request.input("agency", updateRequest.agency);
        request.input("item", updateRequest.item.itemId);
        request.input("offAgenda", updateRequest.offAgenda);
        request.input("subTopic", updateRequest.subTopic);
        request.input("stance", updateRequest.stance);
        request.input("notes", updateRequest.notes);
        request.input("phone", updateRequest.phone);
        request.input("email", updateRequest.email);
        request.input("address", updateRequest.address);
        request.input("status", updateRequest.status);
        request.input("timeToSpeak", updateRequest.timeToSpeak);
        request.input("approvedForDisplay", updateRequest.approvedForDisplay);
        request.input("subItem", updateRequest.subItem);
        request.execute("UpdateRequest").then(function (result) {
            logger.debug("Request updated.", result);
            fulfill(result);
        }).catch(function (err) {
            logger.error("Error in calling update stored procedure.", err);
            reject(err);
        });
    });
}

/**
 * Delete a request in the database.
 * @param {String} requestId
 * @return {Promise}
 */
function deleteRequest(requestId) {
    return new Promise(function (fulfill, reject) {
        // Query
        let request = pool.request();

        request.input("requestId", requestId);
        request.query("UPDATE request SET status = 'deleted' where requestId = @requestId").then(function (result) {
            logger.debug("Request deleted.", result);
            fulfill();
        }).catch(function (err) {
            logger.error("Error executing delete query.", err);
            reject(err);
        });
    });
}

/**
 * Delete a request in the database.
 * @param {String} requestId
 * @return {Promise}
 */
function removeRequest(requestId) {
    return new Promise(function (fulfill, reject) {
        // Query
        let request = pool.request();

        request.input("requestId", requestId);
        request.query("UPDATE request SET status = 'removed' where requestId = @requestId").then(function (result) {
            logger.debug("Request removed.", result);
            fulfill();
        }).catch(function (err) {
            logger.error("Error executing remove query.", err);
            reject(err);
        });
    });
}



/**
 *
 * @param {String} newItem
 * @return {Promise}
 */
function addItem(newItem) {
    return new Promise(function (fulfill, reject) {
        // Query
        let request = pool.request();

        logger.debug("new item", newItem);

        request.input("meetingId", newItem.meetingId);
        request.input("itemName", newItem.itemName);
        request.input("itemOrder", newItem.itemOrder);
        request.input("timeToSpeak", newItem.timeToSpeak);
        request.output("id");
        request.execute("InsertItem").then(function (result) {
            logger.debug("New item inserted.", result);
            fulfill(result.returnValue);
        }).catch(function (err) {
            logger.error("Error in calling insert item stored procedure.", err);
            reject(err);
        });
    });
}


/**
 *
 * @param {String} newSubItem
 * @return {Promise}
 */
function addSubItem(newSubItem) {
    return new Promise(function (fulfill, reject) {
        // Query
        let request = pool.request();
        logger.debug("new sub item", newSubItem);

        request.input("meetingId", newSubItem.meetingId);
        request.input("subItemName", newSubItem.subItemName);
        request.input("subItemOrder", newSubItem.subItemOrder);
        request.input("timeToSpeak", newSubItem.timeToSpeak);
        request.input("itemId", newSubItem.itemId);
        request.output("id");
        request.execute("InsertSubItem").then(function (result) {
            logger.debug("New sub item inserted.", result);
            fulfill(result.returnValue);
        }).catch(function (err) {
            logger.error("Error in calling insert sub item stored procedure.", err);
            reject(err);
        });
    });
}

module.exports = function (cfg, log) {
    // config is delivered frozen and this causes problems in mssql. So, just copy over.
    config = {
        server: cfg.server,
        database: cfg.database,
        user: cfg.user,
        password: cfg.password,
        port: cfg.port,
        options: {
            useUTC: false
        }
    };

    logger = log;

    return {
        version: "1.1",
        dbType: "Microsoft SQL Server",
        getRequest: getRequest,
        getRequests: getRequests,
        addRequest: addRequest,
        updateRequest: updateRequest,
        deleteRequest: deleteRequest,
        removeRequest: removeRequest,
        addMeeting: addMeeting,
        getMeetings: getMeetings,
        updateMeeting: updateMeeting,
        getActiveMeeting: getActiveMeeting,
        startMeeting: startMeeting,
        endMeeting: endMeeting,
        deleteMeeting: deleteMeeting,
        addItem: addItem,
        addSubItem: addSubItem,
        init: setupSql
    };
};
