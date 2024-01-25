const _moduleCity = require('core/interface/_moduleCity');

class CityManager extends _moduleCity {
    /**
     *
     * @param room {string}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityManager', room, gameAccess, roomData);
        this.feats = [
            new (require('src/core/city/feat/city.feat.superviser'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/city.feat.storage'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/city.feat.miner'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/city.feat.explorer'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/city.feat.builder'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/city.feat.spawner'))(room, gameAccess, roomData),
            new (require('core/city/feat/role/city.feat.role'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/city.feat.worker'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/city.feat.transporter'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/city.feat.intercity'))(room, gameAccess, roomData),
            // new (require('src/core/city/feat/city.feat.warrior'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/CityFeatColoniesWorker'))(room, gameAccess, roomData),
            new (require('src/core/city/feat/CityFeatNexus'))(room, gameAccess, roomData),
        ]
        this.firstRun = true;
    }

    updateCity() {

    }

    run() {
        this.preUpdateCity();
        const time = this.gameAccess.getTime();
        this.feats
            .filter(feat => {
                const throttleWant = feat.getThrottle()
                if (this.firstRun || throttleWant <= 1) {
                    return true;
                }
                const lastRun = feat.getLastRunTime();
                const throttle = time - lastRun < throttleWant;
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

    preUpdateCity() {
        const levelRoom = this.roomData.getRoomGame().controller.level;
        if (this.roomData.levelRoom !== levelRoom) {
            this.roomData.levelRoom = levelRoom;
        }
    }
}

module.exports = CityManager;