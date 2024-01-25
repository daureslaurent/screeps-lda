const _moduleCityFeat = require('core/interface/_moduleCityFeat');

class CityFeatWorker extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatWorker', room, gameAccess, roomData, 1);
    }

    run() {
        this.roomData.getSysWorker()
            .run(this.gameAccess, this.roomData, Game.flags[`${this.room}W`]);
    }

}

module.exports = CityFeatWorker;