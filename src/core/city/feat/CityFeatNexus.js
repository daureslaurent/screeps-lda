const _moduleCityFeat = require('core/interface/_moduleCityFeat');

class CityFeatNexus extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatNexus', room, gameAccess, roomData, 4);
    }

    run() {
        this.slowRun();
        this.roomData.getSysCity().getSysNexus()
            .run(this.gameAccess, this.roomData, Game.flags[`${this.room}NEX`])
    }

    slowRun() {
        this.roomData.getSysCity().getSysNexus()
            .update(this.gameAccess, this.roomData, Game.flags[`${this.room}NEX`])
    }
}

module.exports = CityFeatNexus;