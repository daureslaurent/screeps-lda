const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')
const utils = require('utils/utils')

class BotFeatEden extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatEden', BotRole.EDEN, gameAccess, roomDataFactory);
    }


    /**
     *
     * @param creep {Creep}
     */
    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        if (creep == null) {
            return;
        }
        const distance = creep.memory._move && creep.memory._move.path ?
            creep.memory._move.path.length :
            -1;

        const forcedRoom = 'W51N16'
        if (creep.getActiveBodyparts(CLAIM) > 0) {
            if (creep.room.name !== forcedRoom) {
                creep.moveToRoom(forcedRoom, 5);
                return;
            } else if (creep.room.controller) {
                if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                    return;
                } else {
                    if (creep.signController(creep.room.controller, '🫵') === ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                        return;
                    }
                }

            }
        }

        const flag = Game.shard.name === 'shard3' ? Game.flags.EDEN : Game.flags.EDEN2;


        if (flag) {
            if (creep.room.name !== flag.pos.roomName) {
                creep.moveToRoom(flag.pos.roomName, 5);
                utils.talkAction(creep, `👽${distance} | ${creep.ticksToLive} 💀`)
                console.log(`[${Game.shard.name}][${creep.room.name}] EDEN 👽[${distance}] | ${creep.ticksToLive} 💀`)
                return;
            }
        }
        if (Game.shard.name === 'shard3') {
            utils.talkAction(creep, `shard [${Game.shard.name}]`)
            const nearestPortal = this.findNearestPortal(flag.room);
            this.travelToOtherShard(creep, nearestPortal);
            return;
        }

        if (creep.getActiveBodyparts(CLAIM) > 0) {
            if (creep.room.controller) {
                if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                    return;
                } else {
                    if (creep.signController(creep.room.controller, '🫵') === ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                        return;
                    }
                }

            }
        } else if (creep.getActiveBodyparts(WORK) > 0 /* && Game.shard.name !== 'shard3'*/) {
            if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
                creep.memory.action = 'MINING'
            }
            if (creep.store.getFreeCapacity() === 0) {
                creep.memory.action = 'STORE'
            }

            if (creep.memory.action === 'MINING') {
                if (this.mining(creep) === undefined) {
                    creep.moveTo(flag);
                }
                return;

            } else {
                if (this.build(creep) === undefined) {
                    if (this.claim(creep) === undefined) {
                        creep.moveTo(flag);
                    }
                    return;
                }
            }
        }
        creep.moveTo(flag);
    }

    // Function to find the nearest portal in the room
    findNearestPortal(room) {
        const portals = room.find(FIND_STRUCTURES, {
            filter: {
                structureType: STRUCTURE_PORTAL,
            },
        });

        if (portals.length > 0) {
            return portals[0]; // Return the first portal found, you may want to add logic for selecting a specific one
        }

        return null; // No portals found
    }

    // Function to travel to another shard using the found portal
    travelToOtherShard(creep, portal) {
        if (!portal) {
            console.log('No portal found in this room!');
            return;
        }

        if (creep.pos.isNearTo(portal)) {
            creep.moveTo(portal);
            // portal.usePortal(creep);
        } else {
            creep.moveTo(portal);
        }
    }

    mining(creep) {

        if (!creep.memory.targetSourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (source) {
                creep.memory.targetSourceId = source.id;
            }
        }

        const targetSource = Game.getObjectById(creep.memory.targetSourceId);
        if (targetSource) {
            const harvest = creep.harvest(targetSource);
            if (harvest === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetSource);
                return OK;
            } else if (harvest === ERR_NOT_ENOUGH_ENERGY) {
                utils.talkAction(creep, '🫰')
                creep.memory.action = 'STORE'
            } else if (harvest === OK) {
                return OK;
            }
        } else {
            creep.memory.targetSourceId = undefined;
        }
        return undefined;
    }

    /**
     *
     * @param creep {Creep}
     */
    claim(creep) {
        creep.memory.targetSourceId = undefined;
        const controller = creep.room.controller;
        // The creep is carrying energy, so let's upgrade the controller.
        const ret = creep.upgradeController(controller)
        // const pos = Game.flags.C1 || controller
        if (ret === ERR_NOT_IN_RANGE) {
            creep.moveTo(controller, {
                visualizePathStyle: {
                    stroke: '#ffffff',
                },
            });
            return OK
        } else if (ret === OK) {
            return OK;
            // creep.moveOffRoad(pos);
        }
        return undefined;
    }

    build(creep) {
        creep.memory.targetSourceId = undefined;
        const customOrder = [
            STRUCTURE_STORAGE,
            STRUCTURE_CONTAINER,
        ];

        if (!creep.memory.buildCache || creep.memory.buildCache < this.gameAccess.getTime()) {
            creep.memory.buildCache = this.gameAccess.getTime() + 10;
            const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES)
                .sort((a, b) => {
                    const a1 = customOrder.indexOf(a.structureType);
                    const b1 = customOrder.indexOf(b.structureType);
                    return a1 - b1;
                })
                .slice(-2)
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
            } else {
                creep.memory.buildCache = undefined;
            }
        }
        return undefined;
    }
}

module.exports = BotFeatEden;