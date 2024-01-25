const _moduleCity = require('core/interface/_moduleCity');

class _moduleCityWorker extends _moduleCity {
    /**
     *
     * @param name {string}
     * @param room {string}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param throttle {Number}
     * @param role {string}
     */
    constructor(name, room, gameAccess, roomData, throttle, role) {
        super(name, room, gameAccess, roomData);
        this.baseReport = {};
        this.throttle = throttle || 1;
        this.role = role;
    }

    banner() {
        // console.log(`=CITY-FEAT--- -==-- ${this.catching?'|C+|':''}[${this.name}]`)
    }

    slowRun() {
    }

    getThrottle() {
        return this.throttle;
    }

}

module.exports = _moduleCityWorker;