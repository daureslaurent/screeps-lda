const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')

const WITHDRAW = 'W'
const BUILD = 'B'

class CityWorkerConstruct extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerConstruct', roomData.room, gameAccess, roomData, 1, WorkerType.CONSTRUCT);
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param order {WorkerOrder}
     * @param sysStorage {SysStorageManager}
     * @param creep {Creep}
     */
    preWork(sysCity, sysWorker, sysStorage, order, creep) {
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === creep.store.getCapacity()) {
            order.data.withdrawDone = true;
            return true;
        }
        // if (creep.store.getUsedCapacity(RESOURCE_ENERGY) !== creep.store.getCapacity()) {
        //     return false
        // }
        const sysStorageAction = actionHelper.askWithdrawClassicInRoom(
            sysStorage,
            RESOURCE_ENERGY,
            creep.store.getFreeCapacity(RESOURCE_ENERGY),
            creep,
            sysCity.roomName,
        );

        if (sysStorageAction !== undefined) {
            order.data.sysStorageAction = sysStorageAction;
            return true;
        }
        return false;
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
        if (creep.memory.role === BotRole.RECYCLER) {
            return true;
        }
        if (running.data.action === BUILD && creep.store.getUsedCapacity() === 0 && running.data.withdrawDone === true) {
            return true;
        }
        if (running.data.withdrawDone === true && creep.store.getUsedCapacity() === 0) {
            return true;
        }
        const target = this.gameAccess.Game.getObjectById(running.idTarget)
        if (target == null || target.progress === target.progressTotal) {
            return true;
        }

        this.checkCarryState(creep, running);

        if (running.data.action === WITHDRAW && running.data.sysStorageAction !== undefined) {
            running.data.withdrawDone = true;
            return running.data.sysStorageAction;
        } else {
            return actionHelper.getFactory().actionBuildObj(target, creep.id);
        }
    }

    build(creep, running) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(running.idTarget);
        return new SysCityWorkerAction(WorkerAction.BUILD, creep.id, data);
    }


}

module.exports = CityWorkerConstruct;