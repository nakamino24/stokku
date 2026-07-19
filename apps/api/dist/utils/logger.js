"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toUpperCase();
const CURRENT_LEVEL = LogLevel[LOG_LEVEL] ?? LogLevel.INFO;
function formatTimestamp() {
    return new Date().toISOString();
}
function log(level, levelValue, message, meta) {
    if (levelValue < CURRENT_LEVEL)
        return;
    const entry = {
        timestamp: formatTimestamp(),
        level,
        message,
        ...(meta !== undefined ? { meta: typeof meta === 'object' ? meta : { value: meta } } : {}),
    };
    const output = JSON.stringify(entry);
    switch (level) {
        case 'ERROR':
            process.stderr.write(output + '\n');
            break;
        case 'WARN':
            process.stderr.write(output + '\n');
            break;
        default:
            process.stdout.write(output + '\n');
    }
}
exports.logger = {
    debug: (message, meta) => log('DEBUG', LogLevel.DEBUG, message, meta),
    info: (message, meta) => log('INFO', LogLevel.INFO, message, meta),
    warn: (message, meta) => log('WARN', LogLevel.WARN, message, meta),
    error: (message, meta) => log('ERROR', LogLevel.ERROR, message, meta),
};
//# sourceMappingURL=logger.js.map