const utils = require('utils/utils')
const BotRole = require('core/enum/BotRole')
const _moduleBot = require('core/interface/_moduleBot');
const Logs = require('utils/Logs');
const TIMEOUT_CACHE = 15; // Repair structures below 80% health

class BotFeatRodrigo extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatRodrigo', BotRole.RODRIGO, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        /** @type {Creep} */
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        if (creep == null) {
            Logs.logA('creep null -- JD08K', creepFast)
            return;
        }


        const roomData = this.roomDataFactory.getRoomData(creep.memory.baseRoom);
        if (roomData.getSysColon().getColon(creep.memory.colon.target) == null) {
            return;
        }

        if (creep.ticksToLive <= 100) {
            const sysSource = this.getCurrentSysSource(
                creep,
                this.roomDataFactory.getRoomData(creep.memory.baseRoom),
            )
            if (sysSource != null && creep.memory.workBenchId !== undefined) {
                sysSource.unregisterWorkBench(creep.memory.workBenchId)
            }
            return
        }


        // Check if the creep is in the target room
        if (!creep.room.name || creep.room.name !== creepFast.colon.target /*&& false*/) {
            // Move to the target room
            creep.moveTo(new RoomPosition(25, 25, creepFast.colon.target));
            if (creep.memory.roomTransfert === undefined) {
                creep.memory.roomTransfert = true;
            }
        } else {
            if (creep.memory.roomTransfert === true) {
                creep.moveTo(new RoomPosition(25, 25, creepFast.colon.target));
                creep.memory.roomTransfert = undefined;
                return
            }

            if (creep.memory.workBenchId === undefined) {
                // Find source work
                this.setSysSource(creep, roomData);
            }


            const colon = roomData.getSysColon().getColon(creepFast.colon.target)
            const sysSource = colon.getSysSources()
                .filter(s => s.getUsedWorkBenchObj() === 0)[0]

            if (sysSource != null) {
                sysSource.registerWorkBench(creep.id, creep.body, creep.id)
            }

            // let nbMiner = this.getFriends(creep)
            //     .filter(c => c.memory.isRepair === false)
            //     .length
            //
            // if (nbMiner >= 1) {
            //     creep.memory.isRepair = true;
            // }
            // else {
            //     creep.memory.isRepair = false;
            // }
            // utils.talkAction(creep, `${creep.memory.isRepair ? '⚒️' : '🪙'}`)


            if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
                creep.memory.action = 'MINING'
            }
            if (creep.store.getFreeCapacity() === 0) {
                creep.memory.action = 'STORE'
            }

            if (creep.memory.action === 'MINING') {
                return this.mining(creep, roomData);
            } else {
                return this.deposit(creep, roomData);
            }

        }


    }

    pickup(creep) {
        if (!creep.memory.pickupCache || creep.memory.pickupCache < this.gameAccess.getTime()) {
            const resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if (resource) {
                if (creep.pickup(resource) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(resource.pos);
                }
                return OK;
            } else {
                creep.memory.pickupCache = this.gameAccess.getTime() + TIMEOUT_CACHE;
            }
        }
        return undefined;
    }

    setSysSource(creep, roomData) {
        const colon = roomData.getSysColon().getColon(creep.memory.colon.target)

        // Find back
        const old = colon.getSysSources().filter(s => s.containCreeId(creep.id))
        if (old.length > 0) {
            const wbId = old[0].getWorkBenchByCreeId(creep.id).id
            creep.memory.targetSourceId = old[0].getIdBaseObject();
            creep.memory.workBenchId = wbId;
            return;
        }

        if (creep.memory.targetSourceId !== undefined) {
            const trySource = colon.getSysSources()
                .filter(s => s.getIdBaseObject() === creep.memory.targetSourceId)[0]
            if (trySource != null) {
                if (this.registerFromSource(creep, trySource)) {
                    return;
                }
            }
        }

        const source = colon.getSysSources().filter(s => s.getUsedWorkBenchObj().length === 0)
            .slice(-1)[0]
        this.registerFromSource(creep, source);
    }

    registerFromSource(creep, source) {
        if (source) {
            const freeWorkBench = source.getFreeWorkBenchObj();
            if (freeWorkBench.length > 0) {
                const workBenchId = freeWorkBench[0].id
                if (source.registerWorkBench(workBenchId, creep.body, creep.id)) {
                    creep.memory.targetSourceId = source.idWorker;
                    creep.memory.workBenchId = workBenchId;
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @param creep {Creep}
     * @param roomData {RoomData}
     */
    mining(creep, roomData) {
        if (this.pickup(creep) !== undefined) {
            return;
        }
        const colon = roomData.getSysColon().getColon(creep.memory.colon.target)
        const source = colon.getSysSources()
            .filter(s => s.getWorkBenchById(creep.memory.workBenchId))[0];

        if (source == null) {
            creep.memory.targetSourceId = undefined;
            creep.memory.workBenchId = undefined;
            return;
        }

        const targetSource = Game.getObjectById(creep.memory.targetSourceId);
        if (targetSource) {
            const harvest = creep.harvest(targetSource);
            creep.setStatic(true);
            if (harvest === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetSource);
            } else if (harvest === ERR_NOT_ENOUGH_ENERGY) {
                utils.talkAction(creep, '🫰')
                creep.memory.action = 'STORE'

            } else {
                utils.talkAction(creep, '🏐')
            }
        } else {
            creep.memory.targetSourceId = undefined;
            creep.memory.workBenchId = undefined;
        }
    }

    getFriends(creep) {
        const colon = this.getRoomData().getSysColon().getColon(creep.memory.colon.target);
        if (!colon) {
            return [];
        }
        return colon
            .getCreepsIdByRole(BotRole.RODRIGO)
            .filter(id => id !== creep.id)
            .map(c => this.gameAccess.Game.getObjectByIdNonCached(c))
            .filter(c => c != null && c.pos.roomName === creep.pos.roomName)
    }

    deposit(creep, roomData) {
        creep.setStatic(false);

        if (this.repairContainer(creep, 0.9, roomData) !== undefined) {
            return;
        }
        if (this.buildContainer(creep) !== undefined) {
            return;
        }

        const storage = this.store(creep, roomData);
        if (storage) {
            const isArrived = creep.pos.inRangeTo(storage.getPos(), 1)
            if (isArrived) {
                const retFinish = storage.finishActionId(creep.memory.idSysStorage);
                if (retFinish === OK) {
                    creep.memory.idSysStorage = undefined;
                }
            } else {
                creep.moveTo(storage, {
                    visualizePathStyle: {
                        stroke: '#ffffff',
                    },
                });
            }
        } else {
            this.setSysSource(creep, roomData)
            utils.talkAction(creep, '🧑‍🚀')
            const obj = this.gameAccess.Game.getObjectById(creep.memory.targetSourceId);
            const pos = obj != null ?
                obj.pos :
                new RoomPosition(25, 25, creep.memory.colon.target)
            if (!creep.pos.isNearTo(pos)) {
                creep.moveTo(pos, {
                    visualizePathStyle: {
                        stroke: '#ffffff',
                    },
                });
            }
        }

    }

    build(creep) {
        if (!creep.memory.buildCache || creep.memory.buildCache < this.gameAccess.getTime()) {
            creep.memory.buildCache = this.gameAccess.getTime() + TIMEOUT_CACHE;
            const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);

            if (constructionSites.length > 0) {
                const constructionSite = creep.pos.findClosestByPath(constructionSites)
                if (constructionSite) {
                    creep.memory.buildData = constructionSite.id;
                }
            } else {
                creep.memory.buildData = undefined;
            }
        }

        if (creep.memory.buildData !== undefined) {
            const constructionSite = this.gameAccess.Game.getObjectById(creep.memory.buildData)
            if (constructionSite) {
                utils.talkAction(creep, '⚒️')
                const ret = creep.build(constructionSite)
                if (ret === ERR_NOT_IN_RANGE) {
                    creep.moveTo(constructionSite, {
                        visualizePathStyle: {
                            stroke: '#ffffff',
                        },
                    });
                }
                return OK
            }
        }
        return undefined;
    }

    buildContainer(creep) {
        if (!creep.memory.buildCache || creep.memory.buildCache < this.gameAccess.getTime()) {
            creep.memory.buildCache = this.gameAccess.getTime() + TIMEOUT_CACHE;
            const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES)
                .filter(f => f.structureType === STRUCTURE_CONTAINER);

            if (constructionSites.length > 0) {
                const constructionSite = creep.pos.findClosestByPath(constructionSites)
                if (constructionSite) {
                    creep.memory.buildData = constructionSite.id;
                }
            } else {
                creep.memory.buildData = undefined;
            }
        }

        if (creep.memory.buildData !== undefined) {
            const constructionSite = this.gameAccess.Game.getObjectById(creep.memory.buildData)
            if (constructionSite) {
                utils.talkAction(creep, '⚒️')
                const ret = creep.build(constructionSite)
                if (ret === ERR_NOT_IN_RANGE) {
                    creep.moveTo(constructionSite, {
                        visualizePathStyle: {
                            stroke: '#ffffff',
                        },
                    });
                }
                return OK
            }
        }
        return undefined;
    }

    repairContainer(creep, threshold, roomData) {

        const source = this.getCurrentSysSource(creep, roomData);
        if (source) {
            const sysStorage = source.getSysStorage()
            if (sysStorage != null) {
                const storage = sysStorage.getStorage();
                if (storage != null && storage.hits < (storage.hitsMax * threshold)) {
                    const ret = creep.repair(storage)
                    if (ret === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, {
                            visualizePathStyle: {
                                stroke: '#ffffff',
                            },
                        });
                    }
                    return OK;
                    // creep.memory.repairData = storage.id;
                }
            }
        }
        return undefined;


        // const damagedStructure = this.gameAccess.Game.getObjectById(creep.memory.repairData);
        // if (damagedStructure) {
        //     utils.talkAction(creep, '🪄')
        //
        //     const flag = Game.flags.ATT
        //     if (flag !== undefined && flag.room !== undefined && flag.room.name === creep.room.name
        //         && (damagedStructure.pos.x === flag.pos.x && damagedStructure.pos.y === flag.pos.y)) {
        //         console.log('NOT ATTACK ATT FLAG !')
        //         return undefined;
        //     }
        //
        //     const ret = creep.repair(damagedStructure)
        //
        //     if (ret === ERR_NOT_IN_RANGE) {
        //         creep.moveTo(damagedStructure, {visualizePathStyle: {stroke: '#ffffff'}});
        //     }
        //     return OK
        // }
        // return undefined;
    }

    /**
     * @param creep
     * @param roomData
     * @return {SysStorageUnit|undefined}
     */
    store(creep, roomData) {
        const source = this.getCurrentSysSource(creep, roomData);
        if (source == null) {
            this.setSysSource(creep, roomData);
            return;
        }

        const storage = source.getSysStorage();
        if (storage) {
            const ret = storage.deposit(creep.id, RESOURCE_ENERGY, creep.store[RESOURCE_ENERGY]);
            if (ret) {
                creep.memory.idSysStorage = ret;
                return storage;
            }
        }
        return undefined;
    }

    /**
     * @param creep {Creep}
     * @param roomData {RoomData}
     * @return {SysCitySource}
     */
    getCurrentSysSource(creep, roomData) {
        const colon = roomData.getSysColon().getColon(creep.memory.colon.target)
        return colon.getSysSources()
            .filter(s => s.getWorkBenchById(creep.memory.workBenchId) != null)[0];
    }
}

module.exports = BotFeatRodrigo;