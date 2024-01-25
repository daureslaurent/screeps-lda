const _moduleCityWorker = require('core/interface/_moduleCityWorker');
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')
const actionHelper = require('sys/worker/core/sys/SysActionHelper');

const WITHDRAW = 'W'
const DEPOSIT = 'D'

class CityWorkerCarry extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerCarry', roomData.room, gameAccess, roomData, 1, WorkerType.CARRY);
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param sysStorage
     * @param order {WorkerOrder}
     * @param creep
     */
    preWork(sysCity, sysWorker, sysStorage, order, creep) {
        if (creep.store.getFreeCapacity() === 0 && order.data.mandatoryWithdraw === true) {
            return false;
        }
        // let sysStorageAction = actionHelper.askWithdrawClassicInRoom(
        //     sysStorage,
        //     RESOURCE_ENERGY,
        //     creep.store.getFreeCapacity(RESOURCE_ENERGY),
        //     creep,
        //     sysCity.roomName,
        // );
        // if (sysStorageAction == null) {
        //     sysStorageAction = actionHelper.askWithdrawEnergyInRoom(
        //         sysStorage,
        //         RESOURCE_ENERGY,
        //         creep.store.getFreeCapacity(RESOURCE_ENERGY),
        //         creep,
        //         sysCity.roomName,
        //     );
        // }
        //
        // if (sysStorageAction !== undefined) {
        //     order.data.sysStorageAction = sysStorageAction;
        //     return true;
        // }
        return true;
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
        if (creep.store.getUsedCapacity() === 0 && running.data.action === DEPOSIT) {
            return true;
        }
        if (running.data.depositDone === true) {
            return true;
        }
        if (running.data.withdrawDone === true && creep.store.getUsedCapacity() === 0) {
            return true;
        }
        if (!running.data.action) {
            running.data.action = WITHDRAW;
        }
        if (creep.store.getUsedCapacity() > 0) {
            running.data.action = DEPOSIT
        }

        const resource = running.data.resource || RESOURCE_ENERGY;

        if (running.data.action === WITHDRAW) {
            running.data.withdrawDone = true;
            return actionHelper.getFactory().actionWithdrawHelper(
                running.idTarget,
                creep.store.getFreeCapacity(resource),
                resource,
                creep.id,
                running.data.distance)
        } else /*if (creep.store.getFreeCapacity() !== 0 && running.data.action === DEPOSIT)*/ {
            const sysStorageManager = this.roomData.getSysStorage()
            const sysStorage = sysStorageManager
                .getStorageFromIdStorage(running.data.depositSysStorage)
            running.data.depositDone = true;
            return actionHelper.getFactory()
                .actionDepositHelper(
                    sysStorage.id,
                    creep.store.getUsedCapacity(resource),
                    resource,
                    creep.id,
                    running.data.distance)
        }
    }

}

module.exports = CityWorkerCarry;