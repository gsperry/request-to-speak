/* global module,require*/
let logger = null;
let config = require("config");

// eslint-disable-next-line new-cap
let router = require("express").Router();

router.get("/authorize", function(req, res) {
    let userId = req.query.user;
    if(!userId) {
        res.status(400).send("Bad Request");
    } else {
        let users = config.get("AUTH.users");
        let user = users.find(function(u) {
            return u.user === userId;
        });
        if(user) {
            res.status(200).send(JSON.stringify(user.groups));
            logger.info("Authorized access: " + userId);
        } else {
            res.status(403).send("Forbidden");
            logger.error("Attemtped unauthorized access: " + userId);
        }
    }
});

module.exports = function(log) {
    logger = log;

    return router;
};
