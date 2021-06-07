var log4js = require('log4js');
log4js.configure(
//{
//     appenders:  { type: 'file', filename: "./log/all_logs.log", category: 'nth-server', maxLogSize: 10485760, numBackups: 3 },
//     categories: { default: { appenders: ['fileAppender'], level: 'info' } }
    // }
    {
        "appenders": {
            "access": {
                "type": "dateFile",
                "filename": "log/access.log",
                "pattern": "-yyyy-MM-dd",
                "category": "http"
            },
            "app": {
                "type": "file",
                "filename": "log/app.log",
                "maxLogSize": 10485760,
                "numBackups": 3
            },
            "errorFile": {
                "type": "file",
                "filename": "log/errors.log"
            },
            "errors": {
                "type": "logLevelFilter",
                "level": "ERROR",
                "appender": "errorFile"
            }
        },
        "categories": {
            "default": { "appenders": ["app", "errors"], "level": "DEBUG" },
            "http": { "appenders": ["access"], "level": "DEBUG" }
        }
    }
);

var logger = log4js.getLogger('physix-server');
logger.level = 'info';
Object.defineProperty(exports, "LOG", {
    value: logger,
});