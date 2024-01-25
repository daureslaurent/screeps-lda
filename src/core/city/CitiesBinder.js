const InterCityManager = require('sys/interCity/InterCityManager');
const NeedsGame = require('core/interface/model.needsGame')
const mCitiManager = require('core/city/CityManager');
const _module = require('core/interface/_module');

class CitiesBinder extends _module {

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('CitiesBinder', NeedsGame.ALL, gameAccess);
        this.cityModules = [];
        this.roomsData = new Map();

        this.roomDataFactory = roomDataFactory;

        this.interCity = new InterCityManager(roomDataFactory)
        this.checkNewRoom(gameAccess, roomDataFactory);

        this.nextCheck = 0;

    }

    /**
     * @return {*[]}
     */
    run() {
        if (this.nextCheck < this.gameAccess.getTime()) {
            this.checkNewRoom(this.gameAccess, this.roomDataFactory)
            this.nextCheck = this.gameAccess.getTime() + 150;
        }
        return this.cityModules
            .filter(city => {
                city.updateCity();
                return true;
            })
            .map(city => city.execute())
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    checkNewRoom(gameAccess, roomDataFactory) {

        let username;
        let number = 0;

        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            const roomSpawn = spawn.room;
            if (!username) {
                username = spawn.owner.username;
            }
            const cityName = roomSpawn.name;
            // const cityName = cityNamePrefix + number;

            const room = roomSpawn.name;
            if (!this.roomsData.has(room)) {
                const roomData = roomDataFactory.createRoomData(gameAccess, room, cityName, this.interCity, username);
                this.roomsData.set(room, roomData);
                this.cityModules.push(new mCitiManager(room, gameAccess, roomData));
                this.interCity.getOrCreateRoom(room);
            }
            number++;
        }
    }
}

module.exports = CitiesBinder;
