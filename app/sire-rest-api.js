/* global module,require*/
// This module is dependent on a valid SIRE DB API.
let logger = null;
let sireDbApi = null;

// eslint-disable-next-line new-cap
let router = require("express").Router();

router.get("/", function(req, res) {
    res.status(204).end();
});

router.get("/meeting", function(req, res) {
    logger.info("Retrieving meetings from agenda management system.");
    sireDbApi.getMeetings().then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

router.get("/item/:meetingId", function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info("Retrieving items from agenda management system for meetingId: " + meetingId);
    sireDbApi.getItems(meetingId).then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

module.exports = function(log, db) {
    logger = log;
    sireDbApi = db;

    return router;
};
