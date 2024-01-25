const _moduleCityWorker = require('core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')
const actionHelper = require('sys/worker/core/sys/SysActionHelper');
const util = require('utils/utils');

const WITHDRAW = 'W'
const DEPOSIT = 'D'

class CityWorkerPickupDroppedTombstone extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerPickupDroppedTombstone', roomData.room, gameAccess, roomData, 1, WorkerType.PICKUP_TOMB);
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
        /** @Type {Tombstone} */
        const tombstone = this.gameAccess.Game.getObjectById(order.idTarget);
        if (creep.store.getFreeCapacity() >= tombstone.store.getUsedCapacity()) {
            return true
        }
        return false;
    }

    /**
     * @param creep {Creep}
     * @param running {WorkerRunning}
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     */
    run(creep, running, sysCity, sysWorker) {
        util.talkAction(creep, '🪬')
        if (creep.memory.role === BotRole.RECYCLER) {
            return true;
        }
        if (running.data.action === DEPOSIT && creep.store.getUsedCapacity() === 0) {
            return true;
        }


        if (running.data.action === undefined) {
            // Action pickup
            running.data.action = DEPOSIT
            return actionHelper.getFactory()
                .actionPickupTomb(
                    running.idTarget,
                    creep.id);

        } else {
            // Deposit mainStorage
            const sysStorage = this.roomData.getSysStorage()
                .getStorageFromIdStorage(running.data.depositSysStorage)
            running.data.depositDone = true;
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

module.exports = CityWorkerPickupDroppedTombstone;