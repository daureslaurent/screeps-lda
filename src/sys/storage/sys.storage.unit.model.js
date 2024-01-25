const MAX_RETRY_OPERATION = 10;

class SysStorageUnitModel {
    /**
     * @param id {string}
     * @param creepId {string}
     * @param resource {Number}
     * @param amount {Number}
     * @param timeout {Number}
     */
    constructor(id, creepId, resource, amount, timeout) {
        if (!creepId && !resource && !amount && !timeout) {
            this.fromObj(id);
            return
        }
        this.id = id;
        this.creepId = creepId;
        this.resource = resource;
        this.amount = amount;
        this.retry = 0;
        this.timeout = timeout;
        this.finishIn = 0;
        this.state = 'ASKED'
        this.finishAt = 0;
    }


    /**
     * @param obj
     */
    fromObj(obj) {
        this.id = obj.id;
        this.creepId = obj.creepId;
        this.resource = obj.resource;
        this.amount = obj.amount;
        this.retry = obj.retry;
        this.timeout = obj.timeout;
        this.finishIn = obj.finishIn;
        this.state = obj.state;
        this.finishAt = obj.finishAt;
    }

    /**
     * @return {number}
     */
    getRetry() {
        return this.retry;
    }

    isCancel() {
        return this.retry >= MAX_RETRY_OPERATION
    }

    doRetry() {
        this.retry++;
    }

    setFinishIn(time, state, now) {
        this.finishIn = time;
        this.state = state;
        this.finishAt = now;
    }

    finish(currentTime) {
        this.finishIn = this.timeout - currentTime;
    }

}

module.exports = SysStorageUnitModel;