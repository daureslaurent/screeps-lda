const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')
const WorkerType = require('sys/worker/core/model/WorkerType')

const MINNING = 'M'
const DEPOSIT = 'D'

class CityWorkerStarter extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerStarter', roomData.room, gameAccess, roomData, 1, WorkerType.MINING_STARTER);
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
            .getSysCitySource(order.idTarget)
            .registerWorkBench(order.data.workBench, creep.body, creep.id);
        return register === true;
    }

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
        const sysSource = sysCity.getSysCitySource(running.idTarget);
        if (running.data.action === DEPOSIT && creep.store.getUsedCapacity() === 0) {
            const workCount = utils.countBody(creep.body, WORK)
            if (sysSource.getUsedWorkBenchObj() > 2 && (
                (sysSource.getTotalBodyFlow() - workCount) >= sysSource.getNeedBodyFlow() || sysSource.getTotalEnergyStorage() > 1900)) {
                return true;
            }
        }

        this.checkCarryState(creep, running);
        if (running.data.action === MINNING) {
            return this.mining(creep, sysSource, running);
        } else {
            return this.findEnergyRefill(creep, this.roomData.getSysCity(), running);
        }
    }

    clean(running, sysCity, sysWorker) {
        if (running.data !== undefined && running.data.workBench !== undefined) {
            sysCity.getSysCitySource(running.idTarget)
                .unregisterWorkBench(running.data.workBench)
            running.data.workBench = undefined;
        }
        return true;
    }

    mining(creep, sysSource, running) {
        const workBench = sysSource.getWorkBenchById(running.data.workBench)
        if (workBench !== undefined) {
            const pos = workBench.getPos()
            if (creep.pos.isEqualTo(pos)) {
                return actionHelper.getFactory().actionHarvest(running.idTarget, creep.id)
            } else {
                return actionHelper.getFactory().actionMove(pos, creep.id, 0);
            }
        }
        return new SysCityWorkerAction(WorkerAction.NONE, creep.id, undefined);
    }

    findEnergyRefill(creep, sysCity) {
        const energyToFill = sysCity.getEnergyToFill()
            .map(id => this.gameAccess.Game.getObjectById(id))
            .filter(o => o.structureType !== STRUCTURE_TOWER);
        const closest = creep.pos.findClosestByPath(energyToFill);
        if (closest != null) {
            const data = new SysCityWorkerModelActionData();
            data.setTargetId(closest.id);
            // data.amount = -amount;
            data.resource = RESOURCE_ENERGY;
            return new SysCityWorkerAction(WorkerAction.TRANSFER, creep.id, data);
        }
        return true;
    }


}

module.exports = CityWorkerStarter;