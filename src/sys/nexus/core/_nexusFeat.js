const TIMING_ENABLE = true;
class _nexusFeat {
    /**
     * @param name {string}
     * @param updateWait {number}
     * @param levelToTrigger {number}
     */
    constructor(name, updateWait = undefined, levelToTrigger) {
        this.name = name;
        this.needUpdate = updateWait !== undefined
        this.levelToTrigger = levelToTrigger;

        this.lastRun = -1;
        this.updateTO = updateWait || 0;

        this.multiplesInit = false;
        this.isInit = false;

        this.timing = {
            onInit: 0,
            onUpdate: 0,
        }

    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param data
     */
    init(gameAccess, roomData, data) {
        this.refreshLastRun(gameAccess);

        if (TIMING_ENABLE) {
            return this.timingInit(gameAccess, roomData, data);
        }
        return this.basicInit(gameAccess, roomData, data);

    }

    timingInit(gameAccess, roomData, data, prevUsage = 0) {
        this.timing.onInitTmp = Game.cpu.getUsed()
        const ret = this.basicInit(gameAccess, roomData, data)
        const realUsed = Game.cpu.getUsed() - this.timing.onInitTmp
        this.timing.onInit += realUsed
        const tickUsage = prevUsage + realUsed
        if (tickUsage < 0.5 && this.multiplesInit === true && ret === false) {
            return this.timingInit(gameAccess, roomData, data, tickUsage);
        }
        return ret;
    }
    basicInit(gameAccess, roomData, data) {
        const retInit = this.onInit(gameAccess, roomData, data);
        if (retInit === true) {
            this.finishInit();
        }
        return retInit;
    }

    /**
     * @abstract
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param data
     * @return boolean
     */
    onInit(gameAccess, roomData, data) {
    }

    refreshLastRun(gameAccess) {
        this.lastRun = gameAccess.getTime();
    }

    getMultiplesInit() {
        return this.multiplesInit;
    }

    finishInit() {
        this.isInit = true;
    }

    getIsInit() {
        return this.isInit;
    }

    update(gameAccess, roomData, data) {
        if (TIMING_ENABLE) {
            this.timing.onUpdateTmp = Game.cpu.getUsed()
        }
        this.onUpdate(gameAccess, roomData);
        this.refreshLastRun(gameAccess);
        if (TIMING_ENABLE) {
            this.timing.onUpdate = Game.cpu.getUsed() - this.timing.onUpdateTmp
        }
    }

    getNeedUpdate(gameAccess) {
        if (!this.needUpdate) {
            return false;
        }
        return gameAccess.getTime() - this.lastRun >= this.updateTO;
    }
    getUpdateEnable() {
        return this.needUpdate;
    }

    /**
     * @abstract
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param data
     */
    onUpdate(gameAccess, roomData, data) {
    }

    getMinimalLevel() {
        return this.levelToTrigger;
    }

}

module.exports = _nexusFeat;