const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')

const MINNING = 'M'
const DEPOSIT = 'D'

class CityWorkerMiner extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerMiner', roomData.room, gameAccess, roomData, 1, WorkerType.MINING);
    }

    clean(running, sysCity, sysWorker) {
        if (running.data !== undefined && running.data.workBench !== undefined) {
            sysCity.getSysCitySource(running.idTarget)
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
        const register = sysCity
            .getSysCitySource(order.idTarget)
            .registerWorkBench(order.data.workBench, creep.body, creep.id);
        if (register === true) {
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
     */
    run(creep, running, sysCity, sysWorker) {
        if (creep.memory.role === BotRole.RECYCLER) {
            return true;
        }
        const sysSource = sysCity.getSysCitySource(running.idTarget);
        if (running.data.action === DEPOSIT && creep.store.getUsedCapacity() === 0 || sysSource.energy === 0) {
            running.data.action = MINNING;
            return sysSource.askUnRegisterWorkBench(running.data.workBench)
            // const workCount = utils.countBody(creep.body, WORK)
            // if (sysSource.getUsedWorkBenchObj() > 2 && (
            //     (sysSource.getTotalBodyFlow() - workCount) >= sysSource.getNeedBodyFlow() || sysSource.getTotalEnergyStorage() > 1900)
            // ) {
            //     return true;
            // }
        }

        this.checkCarryState(creep, running);
        if (running.data.action === MINNING) {
            return this.mining(creep, sysSource, running);
        } else {
            const sysStorage = sysSource.getSysStorage();
            if (!sysStorage) {
                //BUILD STORAGE
                const storageConstruction = sysSource
                    .getBestOutputStorePos()
                    .lookFor(LOOK_CONSTRUCTION_SITES);
                if (storageConstruction.length > 0) {
                    return actionHelper.getFactory().actionBuildObj(storageConstruction[0], creep.id);
                }
            } else {
                const resource = RESOURCE_ENERGY;
                const creepCarry = creep.store.getUsedCapacity(resource);
                const availableStore = sysStorage.getStore().getFreeCapacity(resource);

                const depositAmount = Math.min(creepCarry, availableStore);
                if (depositAmount === 0) {
                    return true;
                }

                if (sysStorage.getAvailable(resource, depositAmount) === true) {
                    const data = new SysCityWorkerModelActionData();
                    data.setTargetId(sysStorage.id);
                    data.amount = depositAmount;
                    data.resource = resource;
                    return new SysCityWorkerAction(WorkerAction.DEPOSIT_SYS_STORAGE, creep.id, data);
                } else {
                    return true;
                }
            }
        }
    }


    mining(creep, sysSource, running) {
        const workBench = sysSource.getWorkBenchById(running.data.workBench)
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

module.exports = CityWorkerMiner;