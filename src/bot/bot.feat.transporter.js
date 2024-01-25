const utils = require('utils/utils')
const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')

class BotFeatTransporter extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatTransporter', BotRole.TRANSPORTER, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectByIdNonCached(creepFast.id);
        if (creep == null) {
            return;
        }


        if (creep.memory.worker !== undefined) {
            if (creep.memory.timingDead != null) {
                creep.memory.timingDead = undefined;
            }

            if (creep.memory.starterWainting === true) {
                creep.memory.starterWainting = undefined;
                creep.memory.starterWaintingCount = undefined;
                creep.memory.idD = undefined;
            }
            if (creep.memory.worker.runningId !== undefined) {
                const del = this.roomDataFactory.getRoomData(creep.memory.baseRoom)
                    .getSysTransporter().getWorkerRunning().getRunning(creep.memory.worker.runningId)
                if (del === undefined) {
                    creep.memory.idD = undefined;
                    creep.memory.worker = undefined;
                }
            }
            return;
        }

        if (creep.pos.roomName !== creep.memory.baseRoom) {
            utils.talkAction(creep, '🚀')
            creep.moveToRoom(creep.memory.baseRoom);
            return
        }

        const waitingPos = this.getRoomData().getSysCity().getWaitingPos();
        if (!creep.pos.inRangeTo(waitingPos, 1) && creep.memory.idD === undefined) {
            creep.moveTo(waitingPos);
            utils.talkAction(creep, '🚬')
        } else {
            if (!creep.memory.timingDead) {
                creep.memory.timingDead = Game.time;
            }

            if (!creep.memory.starterWainting) {
                creep.memory.starterWainting = true;
            }
            if (creep.memory.starterWaintingCount === undefined) {
                creep.memory.starterWaintingCount = 1;
                creep.memory.timingDead = Game.time;
            }
            const autoKill = Game.time - creep.memory.timingDead;
            if (autoKill >= 500) {
                return creep.suicide()
            }
            if (creep.memory.starterWaintingCount > 1) {
                utils.talkAction(creep, '⭕')
                const currentCarry = creep.store.getUsedCapacity()
                if (currentCarry > 0) {
                    const resourcesCarried = creep.store;
                    const carriedResources = Object.keys(resourcesCarried);
                    const resourceTypesList = carriedResources.map(resourceType => `${resourceType}`);
                    const resourceType = resourceTypesList[0];
                    const currentCarry = creep.store.getUsedCapacity(resourceType)

                    const mainStorage = this.getRoomData().getSysStorage().getMainStorage();
                    const trx = Math.min(currentCarry, mainStorage.getFreeCapacity())

                    if (creep.memory.idD === undefined) {
                        creep.memory.idD = mainStorage.deposit(creep.id, resourceType, trx);
                    }

                    if (mainStorage.getAvailable(resourceType, trx)) {
                        if (mainStorage.typeStorage === STRUCTURE_CONTAINER || mainStorage.structureType === STRUCTURE_STORAGE) {
                            const isArrived = creep.pos.inRangeTo(mainStorage.getPos(), 1)
                            if (isArrived) {
                                const retFinish = mainStorage
                                    .finishActionId(creep.memory.idD);
                                if (retFinish === OK || retFinish === ERR_TIRED) {
                                    creep.memory.idD = undefined;
                                }
                            } else {
                                creep.moveTo(mainStorage.getPos(), {
                                    visualizePathStyle: {
                                        stroke: '#ffffff',
                                    },
                                });
                            }
                        }

                    } else {
                        console.log(`${this.role} ${this.room} - NO MAIN STORAGE !`)
                    }
                }

            } else {
                utils.talkAction(creep, `🚬${creep.memory.starterWaintingCount}`)
                creep.memory.starterWaintingCount += 1;
            }

        }
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

module.exports = BotFeatTransporter;