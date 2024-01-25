const _moduleCity = require('core/interface/_moduleCity');

class _moduleCityFeat extends _moduleCity {
    /**
     *
     * @param name {string}
     * @param room {string}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param throttle {Number}
     */
    constructor(name, room, gameAccess, roomData, throttle) {
        super(name, room, gameAccess, roomData);
        this.baseReport = {};
        this.throttle = throttle || 1;
    }

    banner() {
        // console.log(`=CITY-FEAT--- -==-- ${this.catching?'|C+|':''}[${this.name}]`)
    }

    /**
     * @abstract
     */
    slowRun() {
    }

    /**
     *
     * @param baseReport {ModelCityBaseReport}
     */
    updateBaseReport(baseReport) {
        this.baseReport = baseReport;
    }

    getThrottle() {
        return this.throttle;
    }

}

module.exports = _moduleCityFeat;