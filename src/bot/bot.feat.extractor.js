const utils = require('utils/utils')
const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')

class BotFeatExtractor extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatExtractor', BotRole.EXTRACTOR, gameAccess, roomDataFactory);

        // this.feats = [ new (require('city.feat.spawner'))(room, gameAccess, roomData)]
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

        if (!creep.memory.action) {
            creep.memory.action = 'EXTRACTING'
        }
        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            creep.memory.action = 'EXTRACTING'
        }
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.action = 'FILLING'
        }

        if ('EXTRACTING' === creep.memory.action) {
            // Find Mineral
            let mineral = creep.pos.findClosestByRange(FIND_MINERALS);
            const harvest = creep.harvest(mineral);
            if (harvest === ERR_NOT_IN_RANGE) {
                creep.moveTo(mineral, {
                    visualizePathStyle: {
                        stroke: '#ffaa00',
                    },
                });
            }
            return;

            // Find the extractor in the room
            let extractor = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_EXTRACTOR,
            });

            // const extractor = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            //     filter: (structure) => structure.structureType === STRUCTURE_EXTRACTOR
            // });


            if (!extractor) {
                // If there's no extractor, find the mineral deposit
                let mineral = creep.pos.findClosestByRange(FIND_MINERALS);
                // Construct a new extractor near the mineral deposit
                // creep.room.createConstructionSite(mineral.pos, STRUCTURE_EXTRACTOR);
            } else {
                // Extract the mineral
                const harvest = creep.harvest(extractor);
                if (harvest === ERR_NOT_IN_RANGE) {
                    creep.moveTo(extractor, {
                        visualizePathStyle: {
                            stroke: '#ffaa00',
                        },
                    });
                }
            }
        } else {

            const roomData = this.getRoomData();


            if (!creep.memory.idWithdraw) {
                utils.talkAction(creep, `👜`)
                let resourceExtract;
                Object.entries(creep.store).forEach(([key, value]) => {
                    resourceExtract = key;
                });
                const retStorage = this.store(creep, resourceExtract);
                if (retStorage) {
                    const ret = retStorage.deposit(
                        creep.id, resourceExtract, creep.store.getFreeCapacity(resourceExtract));
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
                const isArrived = creep.pos.inRangeTo(storage, 1)
                if (isArrived) {
                    const sysStorage = this.getRoomData().getSysStorage()
                    const storageSys = sysStorage.getStorageFromIdStorage(idStorageWithdraw)
                    if (storageSys) {
                        const retFinish = storageSys
                            .finishActionId(creep.memory.sysStorageId);
                        if (retFinish === OK) {
                            creep.memory.idWithdraw = undefined;
                            creep.memory.sysStorageId = undefined;
                        }
                    }

                } else {
                    creep.moveTo(storage, {
                        visualizePathStyle: {
                            stroke: '#ffffff',
                        },
                    });
                }


                // const ret = creep.withdraw(storage, RESOURCE_ENERGY, 0);
                // if (ret === ERR_NOT_IN_RANGE) {
                //     creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                // }
                // if (ret === OK) {
                //     const actionRet = roomData.getSysStorage()
                //         .getStorageFromIdStorage(idStorageWithdraw)
                //         .finishActionId(creep.memory.sysStorageId)
                //     if (actionRet === OK) {
                //         creep.memory.idWithdraw = undefined
                //     }
                // }
            } else {
                utils.talkAction(creep, `🤷‍♂️`)
                // creep.moveTo(Game.flags.A);
                creep.memory.idWithdraw = undefined;
            }
        }

    }


    /**
     * @param creep
     * @return {SysStorageUnit|undefined}
     */
    store(creep, resource) {
        const roomData = this.getRoomData()
        const sysStorage = roomData.getSysStorage();
        const mainStorage = sysStorage.getMainStorage();

        // const storages = sysStorage.getStorageFromIdMaster(creep.memory.targetSourceId);
        // const storage = storages.length > 0 ? storages[0] : undefined;

        if (mainStorage) {
            const ret = mainStorage.deposit(creep.id, resource, creep.store.getUsedCapacity(resource));

            if (ret) {
                creep.memory.idSysStorage = ret;
                return mainStorage;
            }
        }
        return undefined;
    }
}

module.exports = BotFeatExtractor;