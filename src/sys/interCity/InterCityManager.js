const SysInterCityColonies = require('src/sys/interCity/sys.inter.city.colonies')
const SysInterCityModelRoom = require('src/sys/interCity/sys.inter.city.model.room');
const SysInterCityGroup = require('sys/group/GroupManager');

class InterCityManager {
    /**
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(roomDataFactory) {
        this.mapColonies = new Map();
        this.mapCities = new Map();
        this.roomDataFactory = roomDataFactory;
        this.group = new SysInterCityGroup(roomDataFactory);
        this.keeperRoom = [];
    }

    /**
     * @param roomMaster
     * @param roomColon
     * @return {boolean}
     */
    takeControl(roomMaster, roomColon) {
        const room = this.getRoomByName(roomColon);
        const existInCities = this.mapCities.has(roomColon)
        if (existInCities) {
            return false;
        }
        if (!room || room.length === 0) {
            this.addColonies(roomMaster, roomColon);
            return true;
        }
        return room[0].getRoomMaster() === roomMaster;
    }

    /**
     * @param roomColon {string}
     * @return {SysInterCityColonies[]}
     */
    getRoomByName(roomColon) {
        const ret = this.getAllColonies()
            .filter(c => c.getRoomName() === roomColon);
        if (!ret) {
            return [];
        }
        return ret;
    }

    /**
     * @return {SysInterCityColonies[]}
     */
    getAllColonies() {
        return Array.from(this.mapColonies.values())
            .filter(s => s != null)
            .reduce((result, value) => {
                return result.concat(value);
            }, [])
    }

    addColonies(roomMaster, roomColon) {
        if (!this.mapColonies.has(roomMaster)) {
            this.mapColonies.set(roomMaster, []);
        }
        const colonies = this.mapColonies.get(roomMaster);
        colonies.push(new SysInterCityColonies(roomMaster, roomColon));
    }

    /**
     * @param roomName
     * @return {SysInterCityModelRoom}
     */
    getOrCreateRoom(roomName) {
        if (!this.mapCities.has(roomName)) {
            this.mapCities.set(roomName, new SysInterCityModelRoom(roomName))
        }
        return this.mapCities.get(roomName);
    }

    /**
     * @return {SysInterCityModelRoom[]}
     */
    getAllRoomCity() {
        return [].concat(...Array.from(this.mapCities.values()));
    }

    /**
     * @param roomName {string}
     * @return {SysStorageManager}
     */
    getSysStorageFromRoom(roomName) {
        return this.roomDataFactory.getRoomData(roomName).getSysStorage();
    }


    /**
     * @param roomName
     * @return {RoomData}
     */
    getRoomDataForRoom(roomName) {
        return this.roomDataFactory.getRoomData(roomName);
    }

    /**
     * @return {SysInterCityGroup}
     */
    getSysGroup() {
        return this.group;
    }

    /**
     * @param roomName {string}
     */
    addKeeperRoom(roomName) {
        if (!this.keeperRoom.includes(roomName)) {
            this.keeperRoom.push(roomName);
        }
    }

    /**
     * @return {string[]}
     */
    getKeeperRoom() {
        return this.keeperRoom;
    }

}

module.exports = InterCityManager;