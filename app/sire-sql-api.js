/* global module,require*/
/* eslint no-console: "off" */

// SQL Connection
let sql = require("mssql");
let logger = null;
let pool = null;

let setupCompleted = function (err) {
    if (err) {
        logger.error(err);
    } else {
        logger.info("SIRE DB connected.");
    }
};

/**
 * initialize SQL connection.
 * @param {config} config
 */
function setupSql(config) {
    pool = new sql.ConnectionPool(config, setupCompleted);
    pool.on("error", function (err) {
        logger.error(err);
    });
}

/**
 * get meetings from agenda management system
 * @return {Promise}
 */
function getMeetings() {
    return new Promise(function (fulfill, reject) {
        let query = "SELECT meet.ammeetingnum as sireId, meet.ammeetingname as meetingName, meet.ammeetingtime as meetingDate " +
            "FROM OnBase.hsi.ammeeting meet " +
            "WHERE CONVERT(date, ammeetingtime) >= CONVERT(date, getdate()) " +
            "ORDER by meet.ammeetingtime asc";
        logger.debug("Statement: " + query);
        pool.request().query(query).then(function (result) {
            logger.debug("Query result.", result.recordset);
            fulfill(result.recordset);
        }, function (err) {
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
    return new Promise(function (fulfill, reject) {
        let itemQuery;
        itemQuery = "SELECT CAST(REPLACE(i.amnumber,'.','') as INT) as itemOrder, t.agendaitemnum as itemId, i.agendatitle as itemName , 2 as timeToSpeak " +
            "FROM OnBase.hsi.amagendaitem i " +
            "inner join OnBase.hsi.ammeetxagendaitem t " +
            "on i.agendaitemnum = t.agendaitemnum " +
            "where i.tgttmeetingnum = @meetingId " +
            "and i.amnumber <> '' " +
            "and (i.sourceagendaitemnum is NULL or i.sourceagendaitemnum = 0) " +
             "order by  CONVERT(bigint, REPLACE(i.amnumber,'.','')) ";

        let itemRequest = pool.request();
        itemRequest.input("meetingId", meetingId);

        logger.debug("MeetingId: " + meetingId);
        logger.debug("Statement: " + itemQuery);
        itemRequest.query(itemQuery).then(function (itemResult) {
            logger.debug("Query result.", itemResult.recordset);
            fulfill(itemResult.recordset);
        }, function (err) {
            logger.error("Query error: " + err);
            reject(err);
        });
    });
}

module.exports = function (log, cfg) {
    // config is delivered frozen and this causes problems in mssql. So, just copy over.
    let config = {
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

    setupSql(config);

    return {
        version: "1.1",
        dbType: "Microsoft SQL Server",
        getMeetings: getMeetings,
        getItems: getItems
    };
};
