const RoomData = require('core/game/RoomData')

class RoomDataFactory {
    constructor() {
        this.container = new Map();
    }

    /**
     *
     * @param room {string}
     * @param cityName {string}
     * @param gameAccess {GameAccess}
     * @param interCity {InterCityManager}
     * @returns {RoomData}
     */
    createRoomData(gameAccess, room, cityName, interCity, username) {
        if (this.container.has(room)) {
            return this.container.get(room)
        }
        const roomData = new RoomData(gameAccess, room, cityName, interCity, username);
        this.container.set(room, roomData);

        return roomData
    }

    /**
     *
     * @param room {string}
     * @returns {RoomData}
     */
    getRoomData(room) {
        return this.container.get(room);
    }

    /**
     *
     * @return {RoomData[]}
     */
    getAllRoomData() {
        return Array.from(this.container.values())
            .filter(c => c != null)
            .reduce((result, value) => {
                return result.concat(value);
            }, []);
    }

}

module.exports = RoomDataFactory;