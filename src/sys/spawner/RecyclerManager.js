const Logs = require('utils/Logs');
const BotRole = require('core/enum/BotRole');
const SpawnerRecycleData = require('sys/spawner/model/SpawnerRecycleData');
const bodyCostCalculator = require('sys/spawner/builder/bodyCostCalculator')
const FlowType = require('core/flow/FlowType');

class RecyclerManager {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;

        /** @type {SpawnerRecycleData[]} */
        this.recycles = []

        this.isCreepsReady = false
        this.currentStrategyRenew = undefined;
        this.fastMode = false;
        this.fastModeMax = 800;
    }

    pushRecycle(idCreep, spawnerId) {
        const exist = this.recycles.filter(r => r.idCreep === idCreep).length > 0;
        if (!exist) {
            this.recycles.push(new SpawnerRecycleData(idCreep, spawnerId, Game.time));
        }
    }

    /**
     * @param idCreep
     */
    finishRecycle(idCreep) {
        this.recycles = this.recycles.filter(r => r.idCreep !== idCreep);
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    update(gameAccess, roomData) {
        this.recycles.forEach(r => {
            r.updateCreep(gameAccess)
        });
        this.recycles = this.recycles.filter(r => r.finish === false)
        const creepsAround = this.recycles.filter(r => r.distance <= 1);
        this.isCreepsReady = creepsAround.length > 0
        const older = Game.time - Math.min(...creepsAround.map(c => c.entryTime))
        this.isCreepsSpawnable = creepsAround.length < 3
            && older < 300
            && creepsAround.filter(d => d.remains < 300).length === 0
        this.fastMode = creepsAround.length >= 5;
    }

    updateStrategyRenew(strategy) {
        if (this.currentStrategyRenew !== strategy && strategy != null) {
            this.currentStrategyRenew = strategy
        }
    }

    getStrategyRenew() {
        return this.currentStrategyRenew
    }

    /**
     * @return {boolean}
     */
    canSpawn() {
        return this.isCreepsSpawnable || !this.isCreepsReady
    }

    /**
     * @return {boolean}
     */
    needRecycle() {
        return this.recycles.length > 0
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    doRenew(gameAccess, roomData) {
        const creepsAround = this.recycles.filter(r => r.distance <= 1);
        if (creepsAround.length === 0) {
            return;
        }
        // if (creepsAround.length >= 3) {
        if (this.doMinLiveGateRodinRenew(creepsAround, gameAccess, roomData) === -1) {
            if (this.doMaxOlderRenew(creepsAround, gameAccess, roomData, 300) === -1) {
                if (this.doMaxLiveGateRenew(creepsAround, gameAccess, roomData) === -1) {
                    return this.doKeepMaxAndCostRenew(creepsAround, gameAccess, roomData)
                }
            }
        }
        // }
        // else {
        //     return this.doRodinRenew(creepsAround, gameAccess, roomData)
        // }
    }

    /**
     * minGate --> (gate[min])
     * @param creepsAround {SpawnerRecycleData[]}
     * @param gameAccess
     * @param roomData
     */
    doMinLiveGateRodinRenew(creepsAround, gameAccess, roomData) {
        const minGate = 300;

        const underGate = creepsAround
            .filter(rd => rd.remains < minGate)
            .sort((a, b) => a.remains - b.remains)
        if (underGate.length > 0) {
            const creepData = underGate.slice(0, 1)[0];
            this.updateStrategyRenew(`minGate[${minGate}] [${creepData.role}][${creepData.idCreep}]`)
            return this.renewCreep(creepData, gameAccess, roomData);
        }
        return -1;
    }

    /**
     * minGate --> (gate[max[1000]])
     * @param creepsAround {SpawnerRecycleData[]}
     * @param gameAccess
     * @param roomData
     */
    doMaxLiveGateRenew(creepsAround, gameAccess, roomData) {
        const maxGate = 1000;

        const underGate = creepsAround
            .filter(rd => rd.remains >= maxGate)
            .sort((a, b) => b.remains - a.remains)
        if (underGate.length > 0) {
            const creepData = underGate.slice(0, 1)[0];
            this.updateStrategyRenew(`gate[max[${maxGate}]`)
            return this.renewCreep(creepData, gameAccess, roomData);
        }
        return -1;
    }

    /**
     * minGate --> (older[max])
     * @param creepsAround {SpawnerRecycleData[]}
     * @param gameAccess
     * @param roomData
     * @param minOld
     */
    doMaxOlderRenew(creepsAround, gameAccess, roomData, minOld) {
        const older = Game.time - Math.min(...creepsAround.map(c => c.entryTime))
        if (older > minOld) {
            return -1;
        }

        const underGate = creepsAround
            .filter(rd => rd.entryTime >= older)
            .sort((a, b) => b.remains - a.remains)
        if (underGate.length > 0) {
            const creepData = underGate.slice(0, 1)[0];
            this.updateStrategyRenew(`older[max]`)
            return this.renewCreep(creepData, gameAccess, roomData);
        }
        return -1;
    }

    /**
     * keep[max]
     * @param creepsAround {SpawnerRecycleData[]}
     * @param gameAccess
     * @param roomData
     */
    doKeepMaxRenew(creepsAround, gameAccess, roomData) {
        const max = Math.max(...creepsAround.map(r => r.remains))

        const maxCreep = creepsAround.filter(r => r.remains === max);
        if (maxCreep.length > 0) {
            const creepData = maxCreep[0];
            this.updateStrategyRenew('keep[max]')
            this.renewCreep(creepData, gameAccess, roomData);
        }
    }

    /**
     * keep[max&cost]
     * @param creepsAround {SpawnerRecycleData[]}
     * @param gameAccess
     * @param roomData
     */
    doKeepMaxAndCostRenew(creepsAround, gameAccess, roomData) {
        creepsAround.sort((a, b) => b.costRecycle - a.costRecycle);
        const highestCostRecycleElements = creepsAround.filter(creep => creep.costRecycle === creepsAround[0].costRecycle);
        highestCostRecycleElements.sort((a, b) => b.remains - a.remains);
        const elementWithHighestRemain = highestCostRecycleElements[0];

        if (elementWithHighestRemain) {
            this.updateStrategyRenew('keep[max&cost]')
            this.renewCreep(elementWithHighestRemain, gameAccess, roomData);
        }
    }

    /**
     * rodin[equal]
     * @param creepsAround {SpawnerRecycleData[]}
     * @param gameAccess
     * @param roomData
     */
    doRodinRenew(creepsAround, gameAccess, roomData) {
        const notRodin = creepsAround.filter(rd => !rd.rodin)
        if (notRodin.length > 0) {
            const dataRecycler = notRodin[0];
            dataRecycler.rodin = true;
            this.updateStrategyRenew('rodin[equal]')
            return this.renewCreep(dataRecycler, gameAccess, roomData);
        }
        else {
            creepsAround.forEach(dr => dr.rodin = false)
            return this.doRodinRenew(creepsAround, gameAccess, roomData);
        }
    }

    /**
     * @param creepData {SpawnerRecycleData}
     * @param gameAccess
     * @param roomData
     */
    renewCreep(creepData, gameAccess, roomData) {
        /** @type {Creep} */
        const creep = gameAccess.Game.getObjectById(creepData.idCreep);
        /** @type {StructureSpawn} */
        const spawner = gameAccess.Game.getObjectById(creepData.spawnerId)

        if (creep && spawner) {
            if (creep.ticksToLive >= this.fastModeMax && this.fastMode) {
                creep.memory.recyclingId = undefined;
                creep.memory.role = String(creep.memory.roleTmp);
                this.finishRecycle(creep.id)
                return OK;
            }
            const body = creep.body.map(b => b.type)
            const bodyCost = bodyCostCalculator.calculateCost(body);
            const costTick = Math.ceil(bodyCost / 2.5 / body.length);

            const retRenew = spawner.renewCreep(creep);

            if (retRenew === OK) {
                creepData.actif = true;
                if (creep.memory.colon !== undefined && creep.memory.roleTmp !== BotRole.EXPLORER) {
                    roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.COLONIES).pushOutput(costTick)
                    const sysColon = roomData.getSysColon().getColon(creep.memory.colon.target);
                    sysColon.addEnergyExchange(-creep, gameAccess.getTime(), creep.memory.roleTmp)
                }
                else {
                    roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.SPAWNER).pushOutput(costTick)
                }
            }
            else if (retRenew === ERR_FULL) {
                creep.memory.recyclingId = undefined;
                creep.memory.role = String(creep.memory.roleTmp);
                this.finishRecycle(creep.id)
            }
            else {
                Logs.error(`err recycling ${retRenew}`, this.roomName);
            }
        }
        return OK
    }


    calculateCost(body) {
        return _.sum(body, part => BODY_PART_COSTS[part])
    }


}

module.exports = RecyclerManager;