const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')

const MINNING = 'M'
const DEPOSIT = 'D'

class WorkerRoleExtractor extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('WorkerRoleExtractor', roomData.room, gameAccess, roomData, 1, WorkerType.EXTRACTOR);
    }

    clean(running, sysCity, sysWorker) {
        if (running.data !== undefined && running.data.workBench !== undefined) {
            sysCity.getSysCityMineral()
                .unregisterWorkBench(running.data.workBench)
            running.data.workBench = undefined;
        }
        return true;
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param sysStorage
     * @param order {WorkerOrder}
     * @param creep {Creep}
     */
    preWork(sysCity, sysWorker, sysStorage, order, creep) {
        const sysMineral = sysCity.getSysCityMineral();
        const resource = sysMineral.typeMineral
        if (creep.store.getUsedCapacity(resource) === 0 && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            return false
        }
        const wbs = sysMineral.getFreeWorkBenchObj().slice(-1);
        if (wbs.length === 0) {
            return false;
        }
        const wbId = wbs[0].id
        const register = sysMineral.registerWorkBench(wbId, creep.body, creep.id)

        if (register === true) {
            order.data.workBench = wbId
            return true;
        } else {
            console.log('REFUSED REGISTER')
        }
        return false;
    }

    // /**
    //  * @param creeps {Creep[]}
    //  * @return {Creep[]}
    //  */
    // creepFilter(creeps){
    // return creeps.filter(c => c.memory.role === BotRole.STARTER)
    //     .sort((a, b) => utils.countBody(a.body, WORK) - utils.countBody(a.body, WORK))
    //     .slice(0, 2);
    // }

    /**
     * @param creep {Creep}
     * @param running {WorkerRunning}
     */
    checkCarryState(creep, running) {
        if (!running.data.action) {
            running.data.action = MINNING;
        }
        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            running.data.action = MINNING
        }
        if (creep.store.getFreeCapacity() === 0) {
            running.data.action = DEPOSIT
        }
    }

    /**
     * @param creep {Creep}
     * @param running {WorkerRunning}
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param sysStorage {SysStorageManager}
     */
    run(creep, running, sysCity, sysWorker, sysStorage) {
        if (creep.memory.role === BotRole.RECYCLER) {
            return true;
        }
        const sysMineral = sysCity.getSysCityMineral();
        const resource = sysMineral.typeMineral;

        if (running.data.action === DEPOSIT && creep.store.getUsedCapacity() === 0 || sysMineral.mineralAmount === 0) {
            running.data.action = MINNING;
            return sysMineral.askUnRegisterWorkBench(running.data.workBench)
        }

        this.checkCarryState(creep, running);
        if (running.data.action === MINNING) {
            return this.mining(creep, sysMineral, running);
        }
        else {
            /** @type {SysStorageUnit} */
            const sysStorage = sysMineral.getSysStorage();
            if (sysStorage == null) {
                return true;
            }
            if (sysStorage) {
                return actionHelper.getFactory().actionDepositHelper(
                    sysStorage.id,
                    creep.store.getUsedCapacity(resource),
                    resource,
                    creep.id
                );
            }
            const creepCarry = creep.store.getUsedCapacity(resource);
            const mainStorage = sysStorage.getMainStorage();
            const availableStore = mainStorage.getStore().getFreeCapacity(resource);
            const depositAmount = Math.min(creepCarry, availableStore);
            if (depositAmount === 0) {
                return true;
            }

            if (mainStorage.getStore().getFreeCapacity() >= depositAmount) {
                const data = new SysCityWorkerModelActionData();
                data.setTargetId(mainStorage.id);
                data.amount = depositAmount;
                data.resource = resource;
                return new SysCityWorkerAction(WorkerAction.DEPOSIT_SYS_STORAGE, creep.id, data);
            } else {
                return true;
            }
            // }
        }
    }


    mining(creep, sysMineral, running) {
        const workBench = sysMineral.getWorkBenchById(running.data.workBench)
        if (workBench !== undefined) {
            const pos = workBench.getPos()
            if (creep.pos.isEqualTo(pos)) {
                return actionHelper.getFactory().actionHarvest(running.idTarget, creep.id);
                // const data = new SysCityWorkerModelActionData();
                // data.setTargetId(running.idTarget);
                // return new SysCityWorkerAction(WorkerAction.HARVEST, creep.id, data);
            } else {
                return actionHelper.getFactory().actionMove(pos, creep.id, 0);
                // const data = new SysCityWorkerModelActionData();
                // data.setTargetPos(pos);
                // return new SysCityWorkerAction(WorkerAction.MOVE, creep.id, data);
            }
        }
        return new SysCityWorkerAction(WorkerAction.NONE, creep.id, undefined);
    }


}

module.exports = WorkerRoleExtractor;