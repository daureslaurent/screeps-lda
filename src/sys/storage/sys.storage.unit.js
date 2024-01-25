const utils = require('utils/utils')
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const SysStorageUnitModel = require('sys/storage/sys.storage.unit.model');
const MAX_HISTORY_OPERATION = 2;
const MAX_HISTORY_STAT = 2;
const MAX_STORAGE_OPERATION = 50;
const TIMEOUT_OPERATION = 70;

class SysStorageUnit {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param idStorage {string}
     * @param accessStorage {AccessStorage}
     */
    constructor(gameAccess, idStorage, accessStorage) {
        this.gameAccess = gameAccess;
        this.idStorage = idStorage;

        //override normal storage
        this.id = idStorage;

        this.queue = [];
        this.history = [];

        this.useInTick = false;

        this.cachedFuture = {};
        this.cachedFutureState = {};

        this.access = accessStorage || AccessStorage.ALL;
        this.stat = {
            count: 0,
            input: 0,
            output: 0,
        };

        const storage = this.gameAccess.Game
            .getObjectById(this.idStorage);
        this.pos = storage.pos;
        this.typeStorage = storage.structureType;
        this.structureType = storage.structureType;

        this.constructMemory()
        this.update();
    }

    constructMemory() {
        if (!Memory.SysStorage) {
            Memory.SysStorage = {};
        }
        if (!Memory.SysStorage.unit) {
            Memory.SysStorage.unit = {};
        }
        if (!Memory.SysStorage.unit[this.idStorage]) {
            Memory.SysStorage.unit[this.idStorage] = [];
        }
        if (Memory.SysStorage.unit[this.idStorage]) {
            const queueMemory = Memory.SysStorage.unit[this.idStorage];
            queueMemory.forEach(value => {
                this.queue.push(new SysStorageUnitModel(value));
            })


        }

        if (!Memory.SysStorage.unitHistory) {
            Memory.SysStorage.unitHistory = {};
        }
        if (!Memory.SysStorage.unitHistory[this.idStorage]) {
            Memory.SysStorage.unitHistory[this.idStorage] = [];
        }
        if (Memory.SysStorage.unitHistory[this.idStorage]) {
            const historyMemory = Memory.SysStorage.unitHistory[this.idStorage];
            historyMemory.forEach(value => {
                this.history.push(new SysStorageUnitModel(value));
            })
            // Memory.SysStorage.unitHistory[this.idStorage] = []
            // this.history = []
        }
    }

    update() {
        // console.log('=================== UPDATE SYS STORAGE UNIT !')
        this.updateStore();
        this.cleanQueue()

        if (this.useInTick) {
            Memory.SysStorage.unit[this.idStorage] = this.queue;
            Memory.SysStorage.unitHistory[this.idStorage] = this.history;
            this.updateStat();
        }
        this.useInTick = false;
    }

    updateStore() {
        const storage = this.gameAccess.Game
            .getObjectByIdNonCached(this.idStorage);
        if (!storage) {
            console.log('slave without view from creep ?')
        } else {
            this.store = storage.store;
        }
    }

    updateStat() {
        const now = this.gameAccess.getTime();
        const maxTime = now - MAX_HISTORY_STAT;
        const rangeData = Array.from(this.history)
            .sort((a, b) => b.finishAt - a.finishAt)
            .filter(v => v.finishAt >= maxTime)
            .filter(v => v.state === 'DONE');
        this.stat.count = rangeData.length;

        const totalInput = rangeData
            .filter(v => v.amount > 0)
            .reduce((accumulator, currentItem) => accumulator + currentItem.amount, 0);
        const totalOutput = rangeData
            .filter(v => v.amount < 0)
            .reduce((accumulator, currentItem) => accumulator + currentItem.amount, 0);
        this.stat.input = totalInput;
        this.stat.output = totalOutput;
    }

    cleanQueue() {
        const time = this.gameAccess.getTime();
        this.queue
            .filter(v => !this.gameAccess.Game.getObjectById(v.creepId) ||
                (!v.timeout || v.timeout < time))
            .map(value => value.id)
            .forEach(v => this.deleteToQueue(v, 'CLEAN'));
    }


    getEnergy() {
        return this.store[RESOURCE_ENERGY];
    }

    getFreeEnergy() {
        return this.store.getFreeCapacity(RESOURCE_ENERGY);
    }

    getTotalCapacity() {
        return this.store.getCapacity();
    }

    getQueueSize() {
        return this.queue.length;
    }

    /**
     * @param resource {string}
     */
    getCacheFuture(resource) {
        if (!this.cachedFutureState[resource]) {
            this.cachedFutureState[resource] = false;
            this.cachedFuture[resource] = 0;
            return undefined;
        }
        return this.cachedFuture[resource];
    }

    /**
     *
     * @param resource {string}
     * @param value {Number}
     */
    updateCacheFuture(resource, value) {
        if (!this.cachedFutureState[resource]) {
            this.cachedFutureState[resource] = true;
        }
        this.cachedFuture[resource] = value;

    }

    invalidateCacheFuture(resource) {
        this.cachedFutureState[resource] = false;
    }

    storageAfterPlay(resource) {
        //Check cache
        // const cache = this.getCacheFuture(resource)
        // if (cache) {
        //     return cache;
        // }

        // Filter the queue to get the items with the specified resource
        const filteredQueue = this.queue
            .filter(q => q.resource === resource);

        // Use reduce to calculate the sum of all amounts
        const futurAmount = filteredQueue
            .reduce((accumulator, currentItem) => accumulator + currentItem.amount, 0);
        const result = this.getStore().getUsedCapacity(resource) + futurAmount
        this.updateCacheFuture(resource, result);
        return result;
    }

    /** PUBLIC **/

    creepAlreadyQueue(creepId) {
        return this.queue
            .filter(q => q.state === 'ASKED')
            .filter(q => q.creepId === creepId)
            .filter(q => q.id !== '0')
            .length !== 0
    }

    getCreepAlreadyQueue(creepId) {
        return this.queue
            .filter(q => q.state === 'ASKED')
            .filter(q => q.creepId === creepId)
            .filter(q => q.id !== '0')

    }

    /**
     *
     * @param resource {string}
     * @param amount {Number}
     * @return {boolean}
     */
    getAvailable(resource, amount) {
        // console.log(`getAvailable(${resource}, ${amount})`)
        if (this.typeStorage === STRUCTURE_TOWER && amount < 0) {
            return false;
        }

        if (this.getQueueSize() > MAX_STORAGE_OPERATION) {
            return false;
        }
        if (amount === 0) {
            return true;
        }
        return this.checkOperation(resource, amount)
    }

    /**
     * @param id {string}
     * @return {boolean}
     */
    containActionId(id) {
        return this.getFromQueue(id) !== undefined;
    }

    /**
     *
     * @param resource {string}
     * @param amount {Number}
     * @return {boolean}
     */
    checkOperation(resource, amount) {
        const futureStorage = this.storageAfterPlay(resource) + amount;

        if (futureStorage <= 0) {
            return false;
        }
        const maxStorage = this.getStore().getCapacity(resource);
        return futureStorage <= maxStorage;
    }

    withdraw(creepId, resource, amount, timeout = TIMEOUT_OPERATION) {
        // console.log(`withdraw(${creepId}, ${resource}, ${amount})`)
        this.useInTick = true;
        // this.invalidateCacheFuture(resource)

        if (this.creepAlreadyQueue(creepId)) {
            console.log('Err creepAlreadyQueue')
            //     return OK;
        }

        // check if enought amount after play

        const futureStorage = this.storageAfterPlay(resource);
        const amountWithdraw = amount > 0 ? -amount : amount;

        if (futureStorage >= amountWithdraw) {
            return this.addToQueue({
                creepId: creepId,
                resource: resource,
                amount: amountWithdraw,
                timeout: timeout,
            })
        }

        // console.log('Err Impossible')
        return undefined;
    }

    deposit(creepId, resource, amount, timeout = TIMEOUT_OPERATION) {
        // console.log(`deposit(${creepId}, ${resource}, ${amount})`)

        this.useInTick = true;
        // this.invalidateCacheFuture(resource)

        const amountDeposit = amount < 0 ? -amount : amount;

        // check if enought amount after play
        const maxStorage = this.getStore().getCapacity(resource);
        if (amountDeposit > maxStorage) {
            console.log('Err ERR_FULL')
            return undefined;
        }

        if (this.creepAlreadyQueue(creepId)) {
            console.log('Err creepAlreadyQueue')
            const id = this.getCreepAlreadyQueue(creepId)[0].id
            //     // console.log(`Err creepAlreadyQueue [${id}]`)
            return id;
        }

        const futurStorage = this.storageAfterPlay(resource) + amount;
        if (futurStorage <= maxStorage) {
            return this.addToQueue({
                creepId: creepId,
                resource: resource,
                amount: amountDeposit,
                timeout: timeout,
            })
        }
        // else {
        //     const available = this.getStore().getFreeCapacity(resource);
        //     if (available === 0){
        //         // console.log('Err ERR_FULL')
        //         return undefined;
        //     }
        //     return this.addToQueue({
        //         creepId: creepId,
        //         resource: resource,
        //         amount: available,
        //         timeout: timeout,
        //     })
        // }
        // console.log('Err ERR_FULL')
        return undefined;
    }

    /** QUEUE **/
    /**
     * @param data {SysStorageUnitModel}
     * @return {string}
     */
    addToQueue(data) {
        // this.invalidateCacheFuture(data.resource)
        const id = utils.generateUniqueId();
        this.queue.push(new SysStorageUnitModel(id, data.creepId, data.resource, data.amount,
            this.gameAccess.getTime() + data.timeout));
        return id;
    }

    /**
     * @param id {string}
     * @param state {string}
     */
    deleteToQueue(id, state) {
        // console.log('toDEL', id)
        const elem = this.getFromQueue(id);
        // console.log('toDEL', elem)

        if (elem) {
            const time = this.gameAccess.getTime();
            elem.setFinishIn(TIMEOUT_OPERATION - (elem.timeout - time), state, time)
            this.history.push(elem);
            if (this.history.length > MAX_HISTORY_OPERATION) {
                this.history.shift();
            }
            // this.invalidateCacheFuture(elem.resource);

            this.queue = this.queue.filter(item => item.id !== elem.id);
        }
    }

    /**
     * @param id {string}
     * @return {SysStorageUnitModel}
     */
    getFromQueue(id) {
        // console.log(`getFromQueue(${id})`)
        const found = this.queue
            .filter(item => item.id === id);
        // console.log(`getFromQueue(${id}) result => ${JSON.stringify(found)}`)
        if (found.length > 0) {
            return found[0]
        }
        console.log(`======================== ERROR SYS-STORAGE ${id}`)
        return undefined;
    }


    cancelAction(id) {
        this.useInTick = true;
        const elem = this.getFromQueue(id);
        if (elem) {
            // this.invalidateCacheFuture(elem.resource)
            this.deleteToQueue(id, 'CANCEL');
        }
    }

    cleanCreep(creepId) {
        this.queue.filter(item => item.creepId === creepId)
            .forEach(item => this.deleteToQueue(item.id, 'RESET_CLEAN_ID'));
    }

    finishActionId(id) {
        // console.log(`finishActionId(${id})`)
        this.useInTick = true;
        const elem = this.getFromQueue(id);
        if (!elem) {
            // console.log(`sysUnit id not found ! ${id}`)
            return ERR_TIRED;
        }


        // this.invalidateCacheFuture(elem.resource)

        const retAction = this.doAction(elem);
        // console.log(`================ RET ACTION SYS STORAGE ${retAction}`)
        if (retAction === OK) {
            this.deleteToQueue(elem.id, 'DONE');
            return OK;
        }
        if (retAction === ERR_NOT_ENOUGH_ENERGY) {
            this.deleteToQueue(elem.id, 'ERR -6');
            return OK;
        } else if (elem.isCancel()) {
            this.deleteToQueue(elem.id, 'CANCEL');
            return OK
        } else if (elem.getRetry() >= 10) {
            const creep = this.gameAccess.Game.getObjectById(elem.creepId)
            utils.talkAction(creep, `⏳${retAction}`)
            elem.doRetry();
            // creep.moveOffRoad(this.getStorage());
        } else {
            this.deleteToQueue(elem.id, 'OUT-RETRY');
            return OK
        }
        return retAction;
    }

    /**
     *
     * @param ac {SysStorageUnitModel}
     */
    doAction(ac) {
        const creep = this.gameAccess.Game.getObjectById(ac.creepId);
        if (!creep) {
            return undefined;
        }
        const isWithdraw = ac.amount < 0;
        const amount = isWithdraw ? -ac.amount : ac.amount;
        let ret;
        if (isWithdraw) {
            ret = creep.withdraw(this.getStorage(), ac.resource, amount);
            // if (ret === ERR_FULL || ret === ERR_NOT_ENOUGH_ENERGY) {
            //     utils.talkAction(creep, `FORCED`)
            //     ret = creep.withdraw(this.getStorage(), ac.resource)
            // }
        } else {

            ret = creep.transfer(this.getStorage(), ac.resource, amount)
            // if (ret === ERR_NOT_ENOUGH_RESOURCES) {
            //     utils.talkAction(creep, `FORCED`)
            //     ret = creep.transfer(this.getStorage(), ac.resource)
            // }
        }
        this.updateStore();
        this.invalidateCacheFuture(ac.resource)

        return ret;
    }

    /**
     * @returns {Object|null}
     */
    getStorage() {
        return this.gameAccess.Game.getObjectById(this.idStorage);
    }

    /**
     * @returns {RoomPosition}
     */
    getPos() {
        return this.pos;
    }

    /**
     * @returns {string}
     */
    getId() {
        return this.idStorage;
    }

    /**
     * @returns {Store}
     */
    getStore() {
        return this.store;
    }

    /**
     *
     * @param resource
     * @return {Number}
     */
    getFuture(resource) {
        return this.storageAfterPlay(resource);
    }

    /**
     * @return {*}
     */
    getFreeCapacity() {
        return this.getStore().getFreeCapacity();
    }

    getFuturePercent(resource) {
        const value = (this.storageAfterPlay(resource) / this.getTotalCapacity()) * 100
        return Math.round(value);
    }

    getHistory() {
        return this.history;
    }

}

module.exports = SysStorageUnit;