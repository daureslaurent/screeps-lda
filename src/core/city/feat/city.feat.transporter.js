const _moduleCityFeat = require('core/interface/_moduleCityFeat');

class CityFeatTransporter extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatTransporter', room, gameAccess, roomData, 1);
    }

    run() {
        this.roomData.getSysTransporter()
            .run(this.gameAccess, this.roomData, Game.flags[`${this.room}T`]);
    }

}

module.exports = CityFeatTransporter;