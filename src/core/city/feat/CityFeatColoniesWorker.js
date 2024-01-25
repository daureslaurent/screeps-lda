const _moduleCityFeat = require('core/interface/_moduleCityFeat');

class CityFeatColoniesWorker extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatColoniesWorker', room, gameAccess, roomData, 1);
    }

    run() {
        this.roomData.getSysColoniesWorker()
            .run(this.gameAccess, this.roomData, Game.flags[`${this.room}WCo`])
    }

}

module.exports = CityFeatColoniesWorker;