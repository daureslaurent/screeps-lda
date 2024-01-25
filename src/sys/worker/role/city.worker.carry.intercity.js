const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')
const actionHelper = require('sys/worker/core/sys/SysActionHelper');

const WITHDRAW = 'W'
const DEPOSIT = 'D'

class CityWorkerCarryIntercity extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerCarryIntercity', roomData.room, gameAccess, roomData, 1, WorkerType.CARRY_INTER_CITY);
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param order {WorkerOrder}
     * @param sysStorage {SysStorageManager}
     * @param creep
     */
    preWork(sysCity, sysWorker, sysStorage, order, creep) {
        return false;
        const tickTarget = utils.estimateTicksBetweenRooms(
            order.pos,
            new RoomPosition(25, 25, order.data.roomName),
            1,
        );
        const fixedTicks = (tickTarget * 2) * 1.3;
        return creep.ticksToLive - fixedTicks > 250;
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
            this.roomData
                .getSysInterCity()
                .getOrCreateRoom(running.data.roomName)
                .isHelped = false
            return true;
        }

        if (!running.data.checkHelped) {
            running.data.checkHelped = true;
            this.roomData
                .getSysInterCity()
                .getOrCreateRoom(running.data.roomName)
                .isHelped = true
        }

        if (!running.data.action) {
            running.data.action = WITHDRAW;
        }
        if (creep.store.getFreeCapacity() === 0) {
            running.data.action = DEPOSIT
        }

        if (running.data.action === WITHDRAW) {
            return actionHelper.getFactory().actionWithdrawHelper(
                running.idTarget,
                creep.store.getFreeCapacity(RESOURCE_ENERGY),
                RESOURCE_ENERGY,
                creep.id)
        } else {
            const sysTarget = this.roomData
                .getSysInterCity()
                .getSysStorageFromRoom(running.data.roomName)
            const mainStorage = sysTarget.getMainStorage();
            if (mainStorage != null) {
                if (creep.pos.roomName !== running.data.roomName) {
                    return actionHelper.getFactory().actionMove(
                        mainStorage.getPos(),
                        creep.id,
                        3,
                    )
                } else {
                    return actionHelper.getFactory()
                        .actionDepositHelperInterCity(
                            mainStorage.id,
                            creep.store.getUsedCapacity(RESOURCE_ENERGY),
                            RESOURCE_ENERGY,
                            creep.id,
                            running.data.roomName,
                        )
                }
            }
        }
    }

}

module.exports = CityWorkerCarryIntercity;