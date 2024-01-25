const _moduleCityWorker = require('core/interface/_moduleCityWorker');
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')
const actionHelper = require('sys/worker/core/sys/SysActionHelper');
const FlowType = require('core/flow/FlowType');

const WITHDRAW = 'W'
const DEPOSIT = 'D'

class CityWorkerCarryColonies extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerCarryColonies', roomData.room, gameAccess, roomData, 1, WorkerType.CARRY_COLONIE);
    }

    /**
     * @param creeps {Creep[]}
     * @param order {WorkerOrder}
     * @return {Creep[]}
     */
    creepFilter(creeps, order){
        return creeps.filter(creep => creep.ticksToLive >= (order.data.distance * 3))
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
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && order.data.mandatoryWithdraw === true) {
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
            sysCity.getSysFlow().getFlowUnit(FlowType.COLONIES).pushInput(running.data.amount)
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

        if (running.data.action === WITHDRAW) {
            running.data.withdrawDone = true;
            return actionHelper.getFactory().actionWithdrawHelper(
                running.idTarget,
                creep.store.getFreeCapacity(RESOURCE_ENERGY),
                RESOURCE_ENERGY,
                creep.id,
                running.data.distance)
        } else /*if (creep.store.getFreeCapacity() !== 0 && running.data.action === DEPOSIT)*/ {
            const sysStorageManager = this.roomData.getSysStorage()
            const sysStorage = sysStorageManager
                .getStorageFromIdStorage(running.data.depositSysStorage)
            running.data.depositDone = true;
            running.data.amount = creep.store.getUsedCapacity(RESOURCE_ENERGY);
            return actionHelper.getFactory()
                .actionDepositHelper(
                    sysStorage.id,
                    creep.store.getUsedCapacity(RESOURCE_ENERGY),
                    RESOURCE_ENERGY,
                    creep.id,
                    running.data.distance)
        }
    }

}

module.exports = CityWorkerCarryColonies;