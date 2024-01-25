const _moduleCityWorker = require('core/interface/_moduleCityWorker');
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')
const actionHelper = require('sys/worker/core/sys/SysActionHelper');
const util = require('utils/utils');

const DEPOSIT = 'D'

class CityWorkerPickupDropped extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerPickupDropped', roomData.room, gameAccess, roomData, 1, WorkerType.PICKUP_DROPPED);
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param sysStorage {SysStorageManager}
     * @param order {WorkerOrder}
     * @param creep {Creep}
     */
    preWork(sysCity, sysWorker, sysStorage, order, creep) {
        if (creep.store.getFreeCapacity() === 0) {
            return false;
        }
        /** @Type {Resource} */
        const pickup = this.gameAccess.Game.getObjectById(order.idTarget);
        if (pickup == null) {
            return false;
        }
        if (pickup > creep.store.getCapacity() && creep.store.getFreeCapacity() > 10) {
            return  true
        }
        if (creep.store.getFreeCapacity() >= pickup.amount) {
            return true;
        }
        if (pickup.amount > 0) {
            return true;
        }
        return false;
        // return pickup != null && ;
    }

    /**
     * @param creep {Creep}
     * @param running {WorkerRunning}
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     */
    run(creep, running, sysCity, sysWorker) {
        util.talkAction(creep, '🪬')
        console.log('==== PID')
        if (creep.memory.role === BotRole.RECYCLER) {
            return true;
        }
        if (running.data.action === DEPOSIT && creep.store.getUsedCapacity() === 0) {
            return true;
        }

        if (running.data.action === undefined) {
            // Action pickup
            running.data.action = DEPOSIT;
            return actionHelper.getFactory()
                .actionPickup(
                    running.idTarget,
                    creep.id);

        } else {
            // Deposit mainStorage
            const sysStorage = this.roomData.getSysStorage()
                .getStorageFromIdStorage(running.data.depositSysStorage)
            return actionHelper.getFactory()
                .actionDepositHelper(
                    sysStorage.id,
                    creep.store.getUsedCapacity(RESOURCE_ENERGY),
                    RESOURCE_ENERGY,
                    creep.id,
                )
        }
    }

}

module.exports = CityWorkerPickupDropped;