const utils = require('utils/utils')

class WorkerRunning {
    /**
     * @param type {WorkerAction}
     * @param pos {RoomPosition}
     * @param idTarget {string}
     * @param data {Object}
     * @param creepId {string}
     */
    constructor(type, pos, idTarget, data, creepId) {
        this.id = utils.generateUniqueId()
        this.type = type
        this.pos = pos
        this.idTarget = idTarget
        this.data = data
        this.creepId = creepId
        this.toDel = false;
        this.firstUse = true;
    }
}

module.exports = WorkerRunning;