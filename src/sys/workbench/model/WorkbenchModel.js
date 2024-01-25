const utils = require('utils/utils')

class WorkbenchModel {
    constructor(pos) {
        this.id = utils.generateUniqueId()
        this.pos = pos;
        this.free = false;
        this.register = false;
        this.bodyFlow = 0;
        this.position = -1;
        this.creepId = undefined;
    }

    /**
     * @return {RoomPosition}
     */
    getPos() {
        return this.pos
    }

    setFree(isFree) {
        this.free = isFree;
    }

    getFree() {
        return this.free;
    }

    getBodyFlow() {
        return this.bodyFlow;
    }

    setRegister(value, bodyFlow = 1, creepId) {
        this.register = value;
        this.bodyFlow = value === false ? 0 : bodyFlow;
        this.creepId = value === false ? undefined : creepId;
    }

    getRegister() {
        return this.register;
    }

}

module.exports = WorkbenchModel;