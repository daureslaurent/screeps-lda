const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const WorkerType = require('sys/worker/core/model/WorkerType')

const WITHDRAW = 'W'
const BUILD = 'B'

class CityWorkerRepair extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerRepair', roomData.room, gameAccess, roomData, 1, WorkerType.REPAIR);
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param sysStorage
     * @param order {WorkerOrder}
     */
    preWork(sysCity, sysWorker, sysStorage, order) {
        const storages = sysStorage
            .getAllStorageByRoom(this.room)
            .filter(s => s.typeStorage !== STRUCTURE_TOWER)
            .filter(s => s.getFuture(RESOURCE_ENERGY) > 500);

        return storages.length > 0;
    }

    checkCarryState(creep, running) {
        if (!running.data.action) {
            running.data.action = WITHDRAW;
        }
        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            running.data.action = WITHDRAW
        }
        if (creep.store.getFreeCapacity() === 0) {
            running.data.action = BUILD
        }
    }

    /**
     * @param creep {Creep}
     * @param running {WorkerRunning}
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     */
    run(creep, running, sysCity, sysWorker) {
        if (running.data.action === BUILD && creep.store.getUsedCapacity() === 0) {
            return true;
        }

        this.checkCarryState(creep, running);

        if (running.data.action === WITHDRAW) {
            return this.findWithdraw(creep, this.roomData.getSysStorage());
        } else {
            const target = this.gameAccess.Game.getObjectById(running.idTarget);
            if (target == null || target.hits === target.hitsMax) {
                return true;
            }
            return this.build(creep, running);
        }
    }

    build(creep, running) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(running.idTarget);
        return new SysCityWorkerAction(WorkerAction.REPAIR, creep.id, data);
    }

    /**
     * @param creep {Creep}
     * @param sysStorage {SysStorageManager}
     */
    findWithdraw(creep, sysStorage) {
        const resource = RESOURCE_ENERGY;
        const storages = sysStorage
            .getAllStorageByRoom(this.room)
            .filter(s => s.getFuture(resource) > 50);
        const storage = storages.length > 0 ? creep.pos.findClosestByPath(storages) : undefined;
        const amount = creep.store.getFreeCapacity(resource);

        if (storage != null) {
            const data = new SysCityWorkerModelActionData();
            data.setTargetId(storage.id);
            data.amount = -amount;
            data.resource = resource;
            return new SysCityWorkerAction(WorkerAction.WITHDRAW_SYS_STORAGE, creep.id, data);
        }
    }

}

module.exports = CityWorkerRepair;