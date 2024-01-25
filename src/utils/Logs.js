const DELIM_0 = '|<<'
const DELIM_1 = '>>|'
const DELIM_CONSOLE = '|'
const DEFAULT_DATA = {}

const DEFAULT_LOG = console.log;

const LOG_ENABLE = false

const doDelim = (value) => {
    return DELIM_0 + value + DELIM_1;
}
const internalLog = (msg, data, value, log = DEFAULT_LOG) => {
    const time = Game.time;
    const finalLog = doDelim(value) + time + DELIM_CONSOLE + JSON.stringify(data) + DELIM_CONSOLE + msg
    return log(finalLog)
}

const internalLogChart = (topic, legend, value, tag) => {
    const time = Game.time;
    const finalLog = doDelim(tag)
        + time + DELIM_CONSOLE
        + topic + DELIM_CONSOLE
        + legend + DELIM_CONSOLE
        + value
    return DEFAULT_LOG(finalLog)
}

/**
 * @type {{halt: (function(*, {}=): void), log: (function(*, {}=): void), logData: (function(*, {}=): void), error: (function(*, {}=): void), logA: (function(*, {}=): void)}}
 */
module.exports = {
    logA: (msg, data = DEFAULT_DATA) => {
        if (LOG_ENABLE) {
            return internalLog(msg, data, 'A')
        }
    },
    logData: (msg, data = DEFAULT_DATA) => {
        if (LOG_ENABLE) {
            return internalLog(msg, data, 'DATA')
        }
    },
    logEx: (data) => {
        if (LOG_ENABLE) {
            return internalLog(Game.time, data, 'EX')
        }
    },
    /**
     *
     * @param topic
     * @param legend
     * @param value
     */
    logChart: (topic, legend, value) => {
        if (true) {
            return internalLogChart(topic, legend, value, 'CHART')
        }
    },
    log: (msg, data = DEFAULT_DATA) => {
        if (LOG_ENABLE) {
            return internalLog(msg, data, '')
        }
    },
    log_override: (data, logger) => {
        if (LOG_ENABLE) {
            return internalLog('RedirectLog', data, '', logger)
        }
    },
    error: (msg, data = DEFAULT_DATA) => {
        if (LOG_ENABLE) {
            return internalLog(msg, data, 'E')
        }
    },
    halt: (msg, data = DEFAULT_DATA) => {
        if (true) {
            return internalLog(msg, data, 'HALT')
        }
    }
}
