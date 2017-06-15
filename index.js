/* global __dirname, require, process */
"use strict";
let winston = require("winston");
let config = require("config");
winston.setLevels(config.get("RTS.log.levels"));
winston.addColors(config.get("RTS.log.colors"));
winston.level = config.get("RTS.log.level");

let express = require("express");
let favicon = require("serve-favicon");
let morgan = require("morgan");
let bodyParser = require("body-parser");
let errorHandler = require("errorhandler");
let http = require("http");
let path = require("path");

let app = express();
let Primus = require("primus");

app.set("port", process.env.PORT || 3000);
app.use(favicon(__dirname + "/client/favicon.ico"));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "client")));

if("development" === app.get("env")) {
    app.use(errorHandler());
}

let server = http.createServer(app);
let transformer = config.get("RTS.wsTransformer");
let primus = new Primus(server, {transformer: transformer});

server.listen(app.get("port"), function() {
    winston.info("Express server listening on port " + app.get("port"));
});

let rtsWsApi = require("./app/rts-ws-api")(primus, winston);
winston.info("RTS WS API Version: " + rtsWsApi.version);

let dbApi = config.get("RTS.dbApi");
let dbConfig = config.get("RTS.dbConfig");

// You can create your own API for Cassandra, Mongo, Oracle, etc. Just adhere to the interface.
let rtsDbApi = require(dbApi)(dbConfig, winston);
winston.info("RTS DB API Type: " + rtsDbApi.dbType);
winston.info("RTS DB API Version: " + rtsDbApi.version);

// In case the app died with an active meeting.
rtsDbApi.getActiveMeeting().then(function(mtg) {
    if(mtg !== undefined) {
        rtsWsApi.startMeeting(mtg);
    }
}, function(err) {
    winston.error("Unable to check for active meeting.");
});

// Setup REST handlers
app.post("/request", function(req, res) {
    let request = req.body;
    winston.info("Adding request from: " + req._remoteAddress);
    winston.debug("Request data.", request);

    winston.trace("Set datetime added.");
    request.timeSubmitted = new Date();

    winston.trace("Upcase name and agency.");
    request.firstName = request.firstName.toUpperCase();
    request.lastName = request.lastName.toUpperCase();
    request.agency = request.agency.toUpperCase();

    winston.trace("Add request with DbApi");
    rtsDbApi.addRequest(request).then(function(id) {
        request.id = id;

        winston.trace("Notify WS clients of new request");
        rtsWsApi.addRequest(request).then(function() {
            winston.info("Request added: " + id);
            res.status(204).end();
        }, function(err) {
            winston.error("Error notifying WS clients of new request.", err);
            res.status(500).send("Unable to send request to admin.");
        });
    }, function(err) {
        winston.error("Error adding request to database: " + err);
        res.status(500).send("Unable to add request to database.");
    });
});

app.patch("/request", function(req, res) {
    let request = req.body;
    winston.info("Updating request from: " + req._remoteAddress);
    winston.debug("Request data.", request);

    winston.trace("Upcase name and agency.");
    request.firstName = request.firstName.toUpperCase();
    request.lastName = request.lastName.toUpperCase();
    request.agency = request.agency.toUpperCase();

    winston.trace("Update request with DbApi");
    rtsDbApi.updateRequest(request).then(function() {
        winston.trace("Notify WS clients of updated request");
        rtsWsApi.updateRequest(request).then(function() {
            winston.info("Request updated.");
            res.status(204).end();
        }, function(err) {
            winston.error("Error notifying WS clients of updated request.", err);
            res.status(500).send("Unable to send updated request to admin.");
        });
    }, function(err) {
        winston.error("Error updating request to database: " + err);
        res.status(500).send("Unable to update request to database.");
    });
});

app.post("/meeting", function(req, res) {
    let meeting = req.body;
    winston.info("Adding meeting sireId: " + meeting.sireId);
    rtsDbApi.addMeeting(meeting).then(function(id) {
        res.status(200).send({meetingId: id});
    }, function(err) {
        res.status(500).send(err);
    });
});

app.put("/meeting/:meetingId", function(req, res) {
    let meeting = req.body;
    let meetingId = req.params.meetingId;
    winston.info("Updating meeting id: " + meeting.meetingId);
    rtsDbApi.saveMeeting(meetingId, meeting).then(function() {
        res.status(204).end();
    }, function(err) {
        res.status(500).send(err);
    });
});

app.post("/startMeeting/:meetingId", function(req, res) {
    let meetingId = req.params.meetingId;
    winston.info("Starting meeeting id: " + meetingId);
    rtsDbApi.startMeeting(meetingId).then(function() {
        rtsDbApi.getActiveMeeting().then(function(meeting) {
            rtsWsApi.startMeeting(meeting).then(function() {
                res.status(204).end();
            }, function(err) {
                winston.error("Error communicating started meeting.", err);
                res.status(500).send(err);
            });
        }, function(err) {
            winston.error("Error getting active meeting.", err);
            res.status(500).send(err);
        });
    }, function(err) {
        winston.error("Error starting meeting.", err);
        res.status(500).send(err);
    });
});

app.post("/endMeeting/:meetingId", function(req, res) {
    let meetingId = req.params.meetingId;
    winston.info("Ending meeeting id: " + meetingId);
    rtsDbApi.endMeeting(meetingId).then(function() {
        rtsWsApi.endActiveMeeting();
        res.status(204).end();
    }, function(err) {
        res.status(500).send(err);
    });
});

app.post("/refreshWall", function(req, res) {
    winston.info("Refreshing display wall.");
    rtsWsApi.refreshWall();
    res.status(204).end();
});

app.get("/meeting", function(req, res) {
    winston.info("Retrieving meetings from database.");
    rtsDbApi.getMeetings().then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

// Sacramento County agenda management system access.
let agendaApi = config.get("SIRE.dbApi");
let sireConfig = config.get("SIRE.dbConfig");
let sireApi = require(agendaApi)(sireConfig, winston);
app.get("/sire/meeting", function(req, res) {
    winston.info("Retrieving meetings from agenda management system.");
    sireApi.getMeetings().then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

app.get("/sire/item/:meetingId", function(req, res) {
    let meetingId = req.params.meetingId;
    winston.info("Retrieving items from agenda management system for meetingId: " + meetingId);
    sireApi.getItems(meetingId).then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});
