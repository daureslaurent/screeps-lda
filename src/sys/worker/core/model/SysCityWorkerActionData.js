class SysCityWorkerActionData {
    constructor(obj) {
        if (obj !== undefined) {
            this.fromObj(obj);
            return;
        }
        this.targetObj = undefined
        this.targetId = undefined
        this.targetPos = undefined
        this.select = undefined;
        this.range = 0;
        this.customRoomData = undefined;
        this.timeout = undefined;
    }

    fromObj(obj) {
        this.targetObj = obj.targetObj;
        this.targetId = obj.targetId;
        this.targetPos = obj.targetPos;
        this.select = obj.select;
        this.range = obj.range;
    }

    setTargetObj(targetObj) {
        this.targetObj = targetObj;
        this.select = 0
    }

    setTargetId(targetId) {
        this.targetId = targetId;
        this.select = 1
    }

    setTargetPos(targetPos) {
        this.targetPos = targetPos;
        this.select = 2
    }

    /**
     * @param gameAccess
     * @return {RoomPosition}
     */
    getTargetPos(gameAccess) {
        if (this.select === 0) {
            return this.targetObj.pos;
        } else if (this.select === 1) {
            const obj = gameAccess.Game.getObjectById(this.targetId);
            return obj != null ? obj.pos : undefined
        } else {
            return this.targetPos;
        }
    }

    /**
     * @param gameAccess
     * @return {Object}
     */
    getTargetObject(gameAccess) {
        if (this.select === 0) {
            return this.targetObj;
        } else if (this.select === 1) {
            return gameAccess.Game.getObjectById(this.targetId)
        } else {
            throw 'ERROR: CANNOT GET OBJ FROM POS !'
        }
    }

    /**
     * @return {string}
     */
    getTargetId() {
        if (this.select === 0) {
            return this.targetObj.id;
        } else if (this.select === 1) {
            return this.targetId
        } else {
            throw 'ERROR: CANNOT GET ID FROM POS !'
        }
    }


}

module.exports = SysCityWorkerActionData;