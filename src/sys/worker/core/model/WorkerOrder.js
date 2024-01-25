const utils = require('utils/utils')

class WorkerOrder {
    /**
     * @param type {WorkerAction}
     * @param pos {RoomPosition}
     * @param idTarget {string}
     * @param data {Object}
     */
    constructor(type, pos, idTarget, data) {
        this.id = utils.generateUniqueId();
        this.type = type
        this.pos = pos
        this.idTarget = idTarget
        this.data = data
    }
}

module.exports = WorkerOrder;