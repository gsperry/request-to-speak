/* global module,require*/
/* eslint no-console: "off" */

// SQL Connection
let sql = require("mssql");
let logger = null;
let pool = null;

/**
 * initialize SQL connection.
 * @param {config} config
 */
function setupSql(config) {
    pool = new sql.ConnectionPool(config, function(err) {
        if(err) {
            logger.error(err);
        } else {
            logger.info("SIRE DB connected.");
        }
    });
    pool.on("error", function(err) {
        logger.error(err);
    });
}

/**
 * get meetings from agenda management system
 * @return {Promise}
 */
function getMeetings() {
    return new Promise(function(fulfill, reject) {
        let query = "SELECT meet.meet_id as sireId, meet.meet_type as meetingName, meet.meet_date as meetingDate " +
        "FROM [sire].[alpha].[ans_meetings] meet " +
        "WHERE meet_date > dateadd(DAY, -1, getdate()) " +
        "ORDER by meetingDate asc";
        logger.debug("Statement: " + query);
        pool.request().query(query).then(function(result) {
            logger.debug("Query result.", result.recordset);
            fulfill(result.recordset);
        }, function(err) {
            logger.error("Query error: " + err);
            reject(err);
        });
    });
}

/**
 * Get all items for a specified meeting
 * @param {string} meetingId
 * @return {recordSet}
 */
function getItems(meetingId) {
    return new Promise(function(fulfill, reject) {
        let request = pool.request();
        request.input("meetingId", meetingId);

        let query = "SELECT item.item_id as itemId, item.item_index as itemOrder, item.caption as itemName " +
        "FROM [sire].[alpha].[ans_meetings] meet " +
        "INNER JOIN [alpha].[ans_meet_items] item ON item.meet_id = meet.meet_id " +
        "WHERE meet.meet_id = @meetingId";
        logger.debug("MeetingId: " + meetingId);
        logger.debug("Statement: " + query);
        request.query(query).then(function(result) {
            logger.debug("Query result.", result.recordset);
            fulfill(result.recordset);
        }, function(err) {
            logger.error("Query error: " + err);
            reject(err);
        });
    });
}

module.exports = function(cfg, log) {
    // config is delivered frozen and this causes problems in mssql. So, just copy over.
    let config = {
        server: cfg.server,
        database: cfg.database,
        user: cfg.user,
        password: cfg.password,
        port: cfg.port
    };

    logger = log;

    setupSql(config);

    return {
        version: "1.0",
        dbType: "Microsoft SQL Server",
        getMeetings: getMeetings,
        getItems: getItems
    };
};
