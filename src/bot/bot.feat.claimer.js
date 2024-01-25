const _moduleBot = require('core/interface/_moduleBot');
const utils = require('utils/utils')
const BotRole = require('core/enum/BotRole')

class BotFeatClaimer extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatClaimer', BotRole.CLAIMER, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);

        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            creep.memory.action = 'WITHDRAW'
        }
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.action = 'UPGRADE'
        }

        const roomData = this.getRoomData();
        const controller = roomData.getRoomGame().controller;

        // Check if the creep is carrying energy, if not, go harvest some.
        if ('WITHDRAW' === creep.memory.action) {
            if (!creep.memory.idWithdraw) {
                const sysStorage = roomData.getSysStorage();
                const storage = sysStorage.getStorageFromIdMaster(controller.id)[0]
                if (storage) {
                    const ret = storage.withdraw(creep.id, RESOURCE_ENERGY, creep.store.getFreeCapacity(RESOURCE_ENERGY))
                    if (ret) {
                        creep.memory.sysStorageId = ret;
                        creep.memory.idWithdraw = storage.id;
                    }
                }
            }

            const target = this.gameAccess.Game.getObjectById(creep.memory.idWithdraw)
            if (target) {
                const isArrived = creep.pos.isNearTo(target);
                if (isArrived) {
                    const sysStorage = this.getRoomData().getSysStorage()
                    const retFinish = sysStorage.getStorageFromIdStorage(target.id)
                        .finishActionId(creep.memory.sysStorageId);
                    if (retFinish === OK) {
                        creep.memory.idWithdraw = undefined;
                        creep.memory.sysStorageId = undefined;
                    }
                } else {
                    creep.moveTo(target);
                }
            } else if (controller.level <= 2) {
                // Find a source or container to harvest from.
                var source = creepFast.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if (source) {
                    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {
                            visualizePathStyle: {
                                stroke: '#ffaa00',
                            },
                        });
                    }
                }
            } else {
                utils.talkAction(creep, '🙃')
                creep.moveTo(controller);
            }


        } else {
            const isArrived = creep.pos.inRangeTo(controller.pos, 3);
            if (isArrived) {
                creep.upgradeController(controller)
                creep.setStatic();

            } else {
                creep.moveTo(controller);
                creep.setStatic(false);

            }

            // // The creep is carrying energy, so let's upgrade the controller.
            // const ret = creep.upgradeController(controller)
            // // const pos = Game.flags.C1 || controller
            // if (ret === ERR_NOT_IN_RANGE) {
            //     creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
            // }
            // else if (ret === OK) {
            //     // creep.moveOffRoad(pos);
            // }
        }


    }
}

module.exports = BotFeatClaimer;