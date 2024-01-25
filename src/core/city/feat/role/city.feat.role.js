const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const modules = [
    require('core/city/feat/role/city.feat.role.miner'),
    require('core/city/feat/role/city.feat.role.carry'),
    require('core/city/feat/role/city.feat.role.builder'),
]

class CityFeatRole extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatRole', room, gameAccess, roomData, 1);

        this.rolesFeat = modules.map(m => new (m)(room, gameAccess, roomData))
        this.firstRun = true;
    }

    slowRun() {
    }

    run() {
        const time = this.gameAccess.getTime();
        this.rolesFeat
            .filter(feat => {
                if (this.firstRun) {
                    return true;
                }
                // feat.updateBaseReport(this.roomData.baseReport)
                const throttle = (time % feat.getThrottle() !== 0);
                if (throttle) {
                    feat.slowRun();
                }
                return !throttle;
            })
            .map(feat => feat.execute());
        if (this.firstRun) {
            this.firstRun = false;
        }

    }

}

module.exports = CityFeatRole;