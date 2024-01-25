const SysColon = require('sys/colon/SysColon');

class SysColonManager {
    /**
     * @param gameAccess {GameAccess}
     * @param roomOri {string}
     */
    constructor(gameAccess, roomOri) {
        this.gameAccess = gameAccess;
        this.roomOri = roomOri;
        this.colonies = new Map();
    }

    tick() {
        this.getAllColon()
            .forEach(v => {
                v.update();
                v.updateGameAccess(this.gameAccess);
            });
    }

    /**
     * @return {SysColon[]}
     */
    getAllColon() {
        return Array.from(this.colonies.values())
            .filter(c => c != null)
            .reduce((result, value) => {
                return result.concat(value);
            }, []);
    }

    /**
     * @param roomName
     * @return {SysColon}
     */
    retrieveColon(roomName) {
        if (roomName === undefined) {
            console.log(`SysColonMan ERR retrieveColon(${roomName})`)
            return undefined;
        }
        if (!this.colonies.has(roomName)) {
            this.colonies.set(roomName, new SysColon(roomName, this.roomOri));
        }
        return this.colonies.get(roomName);
    }

    /**
     * @return {SysColon[]}
     */
    getColons() {
        return [].concat(...Array.from(this.colonies.values()))
            .filter(c => c != null);
    }

    /**
     * @param roomName
     * @return {SysColon}
     */
    getColon(roomName) {
        return this.colonies.get(roomName);
    }

    getSpawnTaggedSummary() {
        return this.getColons()
            .filter(c => c.active && c.getTag())
            .map(c => c.doSummary())
            .filter(c => c !== undefined);
    }

    getRoomsActive() {
        return this.getColons()
            .filter(c => c != null && c.active)
            .map(c => c.roomName);
    }

    /**
     * @return {SysColon[]}
     */
    getRoomsHostile() {
        return this.getColons()
            .filter(c => c.hostile && c.active)
    }

    roomExist(roomName) {
        return this.colonies.has(roomName);
    }

    roomEndPath(roomName) {
        if (!this.colonies.has(roomName)) {
            return false;
        }
        const colon = this.getColon(roomName);
        return colon.getCountSource() === 0 || colon.getCountSource() === 3 || !colon.explored /*|| !colon.constructed*/;
    }

    unTagAll() {
        this.getColons().forEach(co => co.setTag(false))
    }

    /**
     * @return {boolean}
     */
    needExplorer() {
        return this.getExplorerRooms()
            .length > 0;
    }

    /**
     * @return {SysColon[]}
     */
    getExplorerRooms() {
        return this.getColons()
            .filter(c => !c.explored /*&& c.getTag()*/)
    }

    getExplorerBotRooms() {
        return this.getColons()
            .filter(c => !c.explored && c.getTag())
    }

}

module.exports = SysColonManager;