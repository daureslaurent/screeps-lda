class SysInterCityColonies {
    /**
     * @param roomName {string}
     * @param roomMaster {string}
     */
    constructor(roomMaster, roomName) {
        this.roomName = roomName;
        this.roomMaster = roomMaster;
    }

    getRoomName() {
        return this.roomName;
    }

    getRoomMaster() {
        return this.roomMaster;
    }

}

module.exports = SysInterCityColonies;