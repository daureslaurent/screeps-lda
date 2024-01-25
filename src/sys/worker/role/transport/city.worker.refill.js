const _moduleCityWorker = require('core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')
const actionHelper = require('sys/worker/core/sys/SysActionHelper');

const WITHDRAW = 'W'
const DEPOSIT = 'D'

class CityWorkerRefill extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerRefill', roomData.room, gameAccess, roomData, 1, WorkerType.REFILL);
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param order {SysWorkerOrder}
     */
    preWork(sysCity, sysWorker, sysStorage, order, creep) {
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) !== creep.store.getUsedCapacity()) {
            return false;
        }

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            return true
        }

        if (sysStorage.getMainStorage() !== undefined && sysStorage.getMainStorage().getFuture(RESOURCE_ENERGY) > 0
        && sysStorage.getMainStorage().getEnergy() > 0) {
            const withdrawAction = actionHelper.getFactory()
                .actionWithdrawHelper(
                    sysStorage.getMainStorage().id,
                    creep.store.getFreeCapacity(RESOURCE_ENERGY),
                    RESOURCE_ENERGY,
                    creep.id);
            if (withdrawAction !== undefined) {
                order.data.sysStorageAction = withdrawAction;
                return true;
            }
        }
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
        // if (!running.data.action) {
        //     running.data.action = WITHDRAW;
        // }
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            running.data.action = WITHDRAW
        }
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            running.data.action = DEPOSIT
        }
    }

    /**
     * @param creep {Creep}
     * @param running {SysWorkerRunning}
     * @param sysCity {SysCity}
     * @param sysWorker {WorkerCreepAbstract}
     */
    run(creep, running, sysCity, sysWorker) {
        if (creep.memory.role === BotRole.RECYCLER) {
            return true;
        }
        if (running.data.action === DEPOSIT && creep.store.getUsedCapacity() === 0) {
            return true;
        }

        this.checkCarryState(creep, running);

        if (running.data.action === WITHDRAW) {
            return running.data.sysStorageAction;
        } else {
            const friends = sysWorker.getWorkerRunning().getAllRunning()
                .filter(r => r.type === running.type && r.id !== running.id)
            return this.findEnergyRefill(creep, this.roomData.getSysCity(), running, friends);
        }
    }

    /**
     * @param creep
     * @param sysCity {SysCity}
     * @param running {SysWorkerRunning}
     * @param friends {SysWorkerRunning[]}
     * @return {SysCityWorkerAction|boolean}
     */
    findEnergyRefill(creep, sysCity, running, friends) {
        const friendsIdFill = friends.map(f => f.data.idFilling)
            .filter(a => a != null);

        const energyToFill = sysCity.getEnergyToFill()
            .map(id => this.gameAccess.Game.getObjectById(id))
            .filter(s => s.store.getFreeCapacity() !== 0)
            .filter(s => !friendsIdFill.includes(s.id))
        // .filter(s => s.structureType !== STRUCTURE_TOWER)
        const closest = creep.pos.findClosestByPath(energyToFill);
        if (closest != null) {
            running.data.idFilling = closest.id
            const data = new SysCityWorkerModelActionData();
            data.setTargetId(closest.id);
            // data.amount = -amount;
            data.resource = RESOURCE_ENERGY;
            return new SysCityWorkerAction(WorkerAction.TRANSFER, creep.id, data);
        }

        // const towerToFill = sysCity.getEnergyToFill()
        //     .map(id => this.gameAccess.Game.getObjectById(id))
        //     .filter(s => s.structureType === STRUCTURE_TOWER)
        // if (towerToFill.length > 0) {
        //     const closestTower = creep.pos.findClosestByPath(energyToFill);
        //     const data = new SysCityWorkerModelActionData();
        //     data.setTargetId(closestTower.id);
        //     // data.amount = -amount;
        //     data.resource = RESOURCE_ENERGY;
        //     return new SysCityWorkerAction(WorkerAction.TRANSFER, creep.id, data);
        // }
        return true;
    }

}

module.exports = CityWorkerRefill;