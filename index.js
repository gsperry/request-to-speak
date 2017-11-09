/* global __dirname, require, process */
"use strict";
let winston = require("winston");
let config = require("config");
let logTransports = config.get("rts.log.transports");
let logOptions = {
    transports: [],
    levels: config.get("rts.log.levels"),
    level: config.get("rts.log.level")
};
logTransports.forEach(function(t) {
    switch(t.name) {
    case "console": 
        logOptions.transports.push(new winston.transports.Console(t.options));
        break;
    case "syslog":
        require('winston-syslog').Syslog;
        let sysTransport = new winston.transports.Syslog(t.options)
        logOptions.transports.push(sysTransport);
        break;
    }
});

let logger = new winston.Logger(logOptions);
winston.addColors(config.get("rts.log.colors"));

// Sometimes things to awry.
process.on("uncaughtException", function(err) {
    logger.emerg("uncaughtException:", err.message);
    logger.emerg(err.stack);
    process.exit(1);
});

// require middleware packages
let express = require("express");
let passport = require("passport");
let favicon = require("serve-favicon");
let cookieParser = require("cookie-parser");
let bodyParser = require("body-parser");
let http = require("http");
let path = require("path");
let app = express();
let Primus = require("primus");

//setup app server
app.set("port", config.get("rts.port"));
app.use(favicon(__dirname + "/client/favicon.ico"));
app.use(cookieParser("the quick brown fox"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//setup security if configured to do so
if(config.get("rts.security.enabled") === true) {
    require(config.get("rts.security.component"))(passport, config.get("rts.security.passport"));    
    app.use(require('express-session')(config.get("rts.security.session")));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use("/", function(req, res, next) {
        if (req.user == null && req.url !== "/login" && req.url !== "/postResponse") {
            req.session.returnTo = req.url;
            res.redirect('/login');
        } else {
            next(); 
        }
    });
}

// serve up client and apis
app.use("/", express.static(path.join(__dirname, "client")));

let server = http.createServer(app);
let primusConfig = config.get("rts.primus");
let primus = new Primus(server, primusConfig);
// primus.save(__dirname +'/client/lib/primus/primus.js');

server.listen(app.get("port"), function() {
    logger.info("Express server listening on port " + app.get("port"));
});

let rtsWsApi = require("./app/rts-ws-api")(primus, logger);
logger.info("RTS WS API Version: " + rtsWsApi.version);

let dbApi = config.get("rts.dbApi");
let dbConfig = config.get("rts.dbConfig");

// You can create your own API for Cassandra, Mongo, Oracle, etc. Just adhere to the interface.
let rtsDbApi = require(dbApi)(dbConfig, logger);
logger.info("RTS DB API Type: " + rtsDbApi.dbType);
logger.info("RTS DB API Version: " + rtsDbApi.version);

rtsDbApi.init().then(function() {
    // In case the app died with an active meeting.
    rtsDbApi.getActiveMeeting().then(function(mtg) {
        if(mtg !== undefined) {
            logger.info("Active meeting: " + mtg.meetingId);
            rtsWsApi.startMeeting(mtg);
            rtsWsApi.refreshWall();
        } else {
            logger.info("No active meeting.");
        }
    }, function(err) {
        logger.error("Unable to check for active meeting.");
    });
});

app.use("/api", require("./app/rts-rest-api")(logger, rtsDbApi, rtsWsApi));

app.get('/login',
passport.authenticate(config.get("rts.security.passport.strategy"),
  {
    successReturnToOrRedirect: true,
    failureRedirect: '/login'
  })
);

app.post('/postResponse',
passport.authenticate(config.get("rts.security.passport.strategy"), { failureRedirect: '/', successReturnToOrRedirect: true }),
    function(req, res) {
    // res.redirect('/');
    }
);

 // External system integration.
 let agenda;
 try {
    agenda = config.get("agenda");
 } catch(e) {
    logger.info("No agenda system integration.");
 }
 
if(agenda) {
    logger.info("Agenda integration found.");
    let agendaApi = config.get("agenda.dbApi");
    let agendaConfig = config.get("agenda.dbConfig");
    let agendaDbApi = require(agendaApi)(logger, agendaConfig);
    logger.info("Agenda DB API Type: " + agendaDbApi.dbType);
    logger.info("Agenda DB API Version: " + agendaDbApi.version);

    let agendaRestApi = config.get("agenda.restApi");
    logger.info("Agenda REST API: " + agendaRestApi);    
    app.use("/agenda", require(agendaRestApi)(logger, agendaDbApi));
}
