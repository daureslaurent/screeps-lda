const utils = require('utils/utils')
const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')
const customOrder = [
    STRUCTURE_EXTENSION,
    STRUCTURE_CONTAINER,
    STRUCTURE_ROAD,
]
const REPAIR_THRESHOLD = 0.3; // Repair structures below 80% health

class BotFeatBuilder extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatBuilder', BotRole.BUILDER, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        if (creep == null) {
            return;

        }
        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            creep.memory.action = 'FILLING'
        }
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.action = 'BUILDING'
        }
        if ('BUILDING' !== creep.memory.action && 'FILLING' !== creep.memory.action) {
            creep.memory.action = 'FILLING'
        }

        // console.log(`BUILDER ${creep.name} ${creep.memory.action}`)
        const roomData = this.getRoomData();
        const friends = roomData
            .getCreeps()
            .map(c => this.gameAccess.Game.getObjectById(c.id))
            .filter(c => c.memory.role === creepFast.role)
        const creepRepair = friends
            .filter(c => c.memory.isRepair)
            .length
        if (friends.length > 1) {
            if (creepRepair === 0) {
                creep.memory.isRepair = true;
            } else if (creepRepair > 1) {
                creep.memory.isRepair = false;
            }
        }

        if ('BUILDING' === creep.memory.action) {
            creep.memory.idWithdraw = undefined;

            if (!creep.memory.isWorking) {
                const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES)
                    .sort((a, b) => {
                        const roleAIndex = customOrder.indexOf(a.structureType);
                        const roleBIndex = customOrder.indexOf(b.structureType);
                        return roleAIndex - roleBIndex;
                    })

                const containContainer = constructionSites
                    .filter(c => c.structureType === STRUCTURE_CONTAINER || c.structureType === STRUCTURE_EXTENSION)
                    .length;

                const constructionSite = containContainer > 0 ?
                    constructionSites[0] :
                    creep.pos.findClosestByPath(constructionSites)
                if (constructionSite /*&& !creep.memory.isRepair*/) {
                    creep.memory.isWorking = constructionSite.id;
                    creep.memory.typeWork = 'CONSTRUCT';
                } else {
                    const damagedStructurePrio = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => structure.hits < structure.hitsMax * REPAIR_THRESHOLD &&
                            structure.structureType !== STRUCTURE_WALL,
                    });
                    const damagedStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => structure.hits < structure.hitsMax &&
                            structure.structureType !== STRUCTURE_WALL,
                    });

                    if (damagedStructurePrio) {
                        creep.memory.isWorking = damagedStructurePrio.id;
                        creep.memory.typeWork = 'REPAIR';
                    }
                    if (!damagedStructurePrio && damagedStructure) {
                        creep.memory.isWorking = damagedStructure.id;
                        creep.memory.typeWork = 'REPAIR';
                    }
                }

                if (!creep.memory.typeWork) {
                    creep.memory.isWorking = undefined;
                    creep.memory.typeWork = 'WAITING';
                }
            }


            if (creep.memory.typeWork === 'CONSTRUCT') {
                utils.talkAction(creep, '⚒️')
                const site = this.gameAccess.Game.getObjectById(creep.memory.isWorking);
                if (site) {
                    const ret = creep.build(site)
                    if (ret === ERR_NOT_IN_RANGE) {
                        creep.moveTo(site, {
                            visualizePathStyle: {
                                stroke: '#ffffff',
                            },
                        });
                    } else if (ret === OK) {
                        // creep.moveOffRoad();
                    } else {
                        creep.memory.isWorking = undefined;
                        creep.memory.typeWork = undefined;
                    }
                } else {
                    creep.memory.isWorking = undefined;
                    creep.memory.typeWork = undefined;
                }
            } else if (creep.memory.typeWork === 'REPAIR') {
                const site = this.gameAccess.Game.getObjectById(creep.memory.isWorking);
                if (site) {
                    const ret = creep.repair(site)
                    utils.talkAction(creep, `🪄 ${ret}`)

                    if (ret === ERR_NOT_IN_RANGE) {
                        creep.moveTo(site, {
                            visualizePathStyle: {
                                stroke: '#ffffff',
                            },
                        });
                    }
                    if (ret === OK) {
                        // creep.moveOffRoad()
                        creep.memory.isWorking = undefined;
                        creep.memory.typeWork = undefined;
                    }
                }

            } else {
                utils.talkAction(creep, '💮')
            }
        } else {

            if (this.pickup(creep) === OK) {
                return;
            }
            const roomData = this.getRoomData();


            if (!creep.memory.idWithdraw) {
                utils.talkAction(creep, `👜`)
                const sysStorage = this.getRoomData().getSysStorage();
                const retStorage = this.foundWithdrawSysStorage(creep, sysStorage);
                if (retStorage) {
                    const ret = retStorage.withdraw(
                        creep.id, RESOURCE_ENERGY, creep.store.getFreeCapacity(RESOURCE_ENERGY));
                    if (ret) {
                        creep.memory.sysStorageId = ret;
                        creep.memory.idWithdraw = retStorage.getId();
                    }
                }
            }


            // const storage = creep.pos.findClosestByPath(storages);
            const idStorageWithdraw = creep.memory.idWithdraw;
            const storage = this.gameAccess.Game.getObjectById(idStorageWithdraw);
            if (storage) {
                const ret = creep.withdraw(storage, RESOURCE_ENERGY, 0);
                if (ret === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {
                        visualizePathStyle: {
                            stroke: '#ffaa00',
                        },
                    });
                }
                if (ret === OK) {
                    const actionRet = roomData.getSysStorage()
                        .getStorageFromIdStorage(idStorageWithdraw)
                        .finishActionId(creep.memory.sysStorageId)
                    if (actionRet === OK) {
                        creep.memory.idWithdraw = undefined
                    }
                }
            } else {

                const sourceMemory = creep.memory.source;
                if (!sourceMemory) {
                    const source = roomData.getSourcesForMining(creepFast.id);
                    creep.memory.source = source;
                    return
                }

                const source = this.gameAccess.Game.getObjectById(sourceMemory);
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {
                        visualizePathStyle: {
                            stroke: '#ffaa00',
                        },
                    });
                }

                utils.talkAction(creep, `🤷‍♂️`)
                // creep.moveTo(Game.flags.A);
                creep.memory.idWithdraw = undefined;
            }
        }

    }

    /**
     *
     * @param creep
     * @param sysStorage
     * @returns {SysStorageManager}
     */
    foundWithdrawSysStorage(creep, sysStorage) {
        const resource = RESOURCE_ENERGY;
        const maxWithdraw = -creep.store.getFreeCapacity(resource)
        const storageUnits = sysStorage.getAvailableStorageUnit(resource, maxWithdraw);
        const storage = creep.pos.findClosestByPath(storageUnits
            .map(value => value.getStorage())
            .filter(s => s != null),
        );
        if (!storage) {
            return undefined;
        }
        const storageUnit = sysStorage.getStorageFromIdStorage(storage.id);
        if (!storageUnit) {
            return undefined;
        }
        return storageUnit;
    }

    pickup(creep) {
        if (!creep.memory.pickupCache || creep.memory.pickupCache < this.gameAccess.getTime()) {
            creep.memory.pickupCache = this.gameAccess.getTime() + 50;
            const resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if (resource) {
                if (creep.pickup(resource) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(resource);
                    creep.memory.pickupCache = undefined;
                }
                return OK;
            }
        }
        return undefined;
    }
}

module.exports = BotFeatBuilder;