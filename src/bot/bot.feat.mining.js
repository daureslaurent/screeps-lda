const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')
const AccessStorage = require('sys/storage/sys.storage.unit.access.model')
const utils = require('utils/utils');

class BotFeatMining extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatMining', BotRole.MINER, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creep {Creep}
     */
    run(creepFast) {
        const roomData = this.getRoomData();
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);

        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            creep.memory.action = 'MINING'
        }
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.action = 'STORE'
        }

        if ('MINING' === creep.memory.action) {
            creep.memory.target = undefined;
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
        } else {
            if (!creep.memory.target) {
                const sysStorage = this.getRoomData().getSysStorage()
                const storages = sysStorage.getStorageFromIdMaster(creep.memory.source);
                const containLink = storages
                    .filter(s => s.access === AccessStorage.LINK_DEPOSIT)
                    .filter(s => s.getAvailable(RESOURCE_ENERGY, creep.store[RESOURCE_ENERGY]))
                    .length !== 0;

                if (!storages || storages.length === 0) {
                    const fill = this.fillingRoomEnergy(creep, roomData);
                    if (fill) {
                        creep.memory.target = fill.id
                    }
                    return;
                }


                const storage = containLink ?
                    storages.filter(s => s.access === AccessStorage.LINK_DEPOSIT)[0] :
                    storages[0]

                const storageRet = storage
                    .deposit(creep.id, RESOURCE_ENERGY, creep.store[RESOURCE_ENERGY])

                if (storageRet) {
                    creep.memory.sysStorageId = storageRet;
                    creep.memory.target = storage.id;
                } else {
                    creep.memory.sysStorageId = undefined;
                    creep.memory.target = undefined;
                    console.log(`ask deposit not OK ! [${storageRet}]`);
                }
            }

            const target = this.gameAccess.Game.getObjectById(creep.memory.target);

            if (target &&
                target.structureType !== STRUCTURE_SPAWN &&
                target.structureType !== STRUCTURE_EXTENSION &&
                target.structureType !== STRUCTURE_LINK
            ) {
                const transfert = creep.pos.inRangeTo(target, 1)
                if (!transfert) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff',
                        },
                    });
                } else if (transfert) {
                    const sysStorage = this.getRoomData().getSysStorage()
                    const retFinish = sysStorage.getStorageFromIdStorage(target.id)
                        .finishActionId(creep.memory.sysStorageId);
                    if (retFinish === OK) {
                        creep.memory.sysStorageId = undefined;
                        creep.memory.target = undefined;
                    }
                }
            } else if (target) {
                const transfert = creep.transfer(target, RESOURCE_ENERGY);
                if (transfert === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffaa00',
                        },
                    });
                }
                if (transfert === ERR_FULL) {
                    creep.memory.idDeposit = undefined;
                }
                if (transfert === OK) {
                    creep.memory.idDeposit = undefined;
                }
            }
            // else {
            //     utils.talkAction(creep, '⚒️')
            //     creep.memory.target = roomData.baseReport.retrieveStorageFromIdObject(creep.memory.source);
            //     const constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            //     if (constructionSite) {
            //         if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
            //             creep.moveTo(constructionSite, {visualizePathStyle: {stroke: '#ffffff'}});
            //         }
            //     }
            //     else {
            //         creep.memory.target = undefined;
            //     }
            // }

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

    fillingRoomEnergy(creep, roomData) {
        utils.talkAction(creep, '🎯')

        // const friends = this.getFriends(creep)
        //     .map(c => c.memory.idDeposit);
        const energyToFill = [...roomData.getEnergyToFill()]
            .filter(e => e.structureType === STRUCTURE_SPAWN)
        // .filter(storage => {
        //     const usedByFriends = friends.includes(storage.id)
        //     // console.log(`====filter ${storage.id}[${!usedByFriends}][${friends}]`)
        //     return !usedByFriends
        // })
        // .filter(s =>
        //     (s.structureType === STRUCTURE_TOWER && s.store[RESOURCE_ENERGY] < 100)
        //     || s.structureType !== STRUCTURE_TOWER
        // )
        const toFill = creep.pos.findClosestByPath(energyToFill);
        return toFill;
    }

}

module.exports = BotFeatMining;