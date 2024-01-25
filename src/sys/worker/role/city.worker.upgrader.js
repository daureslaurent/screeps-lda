const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')

const UPGRADE = 'M'
const WITHDRAW = 'D'

class CityWorkerUpgrader extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerUpgrader', roomData.room, gameAccess, roomData, 1, WorkerType.UPGRADER);
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
        const register = sysCity
            .getSysCityController()
            .registerWorkBench(order.data.workBench, creep.body, creep.id);
        if (register === true) {
            return true;
        } else {
            console.log('REFUSED REGISTER')
        }
        return false;
    }

    clean(running, sysCity, sysWorker) {
        if (running.data !== undefined && running.data.workBench !== undefined) {
            sysCity.getSysCityController()
                .unregisterWorkBench(running.data.workBench)
            running.data.workBench = undefined;
        }
        return true;
    }

    checkCarryState(creep, running) {
        if (!running.data.action) {
            running.data.action = WITHDRAW;
        }
        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            running.data.action = WITHDRAW
        }
        if (creep.store.getFreeCapacity() === 0) {
            running.data.action = UPGRADE
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
        const sysController = sysCity.getSysCityController();
        if (running.data.action === UPGRADE && creep.store.getUsedCapacity() === 0) {
            running.data.action = WITHDRAW
            return sysController.askUnRegisterWorkBench(running.data.workBench)
        }

        this.checkCarryState(creep, running);

        if (running.data.action === WITHDRAW) {
            const sysStorage = sysController.getSysStorage();
            if (sysStorage !== undefined) {
                const resource = RESOURCE_ENERGY;
                const creepCarryFree = creep.store.getFreeCapacity(resource);
                return actionHelper.getFactory().actionWithdrawHelper(
                    sysStorage.id,
                    creepCarryFree,
                    resource,
                    creep.id)
            } else {
                return this.findWithdraw(creep, this.roomData.getSysStorage());
            }
        } else {
            return this.upgradeWorkbench(creep, sysController, running)
            // return actionHelper.getFactory().actionUpgrade(running.idTarget, creep.id)
        }
    }

    mining(creep) {

        let room = Game.rooms[creep.pos.roomName];
        let source = room.find(FIND_SOURCES)[0];


        // const workBench = sysSource.getWorkBenchById(running.data.workBench)
        if (source !== undefined) {
            const pos = source.pos
            if (creep.pos.isNearTo(pos)) {
                return actionHelper.getFactory().actionHarvest(source.id, creep.id);
                // const data = new SysCityWorkerModelActionData();
                // data.setTargetId(running.idTarget);
                // return new SysCityWorkerAction(WorkerAction.HARVEST, creep.id, data);
            } else {
                return actionHelper.getFactory().actionMove(pos, creep.id, 1);
                // const data = new SysCityWorkerModelActionData();
                // data.setTargetPos(pos);
                // return new SysCityWorkerAction(WorkerAction.MOVE, creep.id, data);
            }
        }
        return new SysCityWorkerAction(WorkerAction.NONE, creep.id, undefined);
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
        } else {
            return this.mining(creep)
        }
    }

    upgradeWorkbench(creep, sysController, running) {
        const workBench = sysController.getWorkBenchById(running.data.workBench)
        if (workBench !== undefined) {
            const pos = workBench.getPos()
            if (creep.pos.isEqualTo(pos)) {
                return actionHelper.getFactory().actionUpgrade(running.idTarget, creep.id)
            } else {
                return actionHelper.getFactory().actionMove(pos, creep.id, 0);
            }
        }
        return new SysCityWorkerAction(WorkerAction.NONE, creep.id, undefined);
    }

}

module.exports = CityWorkerUpgrader;