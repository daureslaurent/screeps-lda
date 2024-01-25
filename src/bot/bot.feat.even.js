const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')

class BotFeatEven extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatEven', BotRole.GLOBAL, gameAccess, roomDataFactory);

        // this.feats = [ new (require('city.feat.spawner'))(room, gameAccess, roomData)]
    }

    /**
     *
     * @param creep {Creep}
     */
    run(creepFast) {
        const roomData = this.getRoomData();
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);

        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            creep.memory.action = 'FILLING'
        }
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.action = 'EVEN'
        }

        if ('FILLING' === creep.memory.action) {
            // If the creep has empty space in its inventory, find a source
            if (!creep.memory.source) {
                const source = roomData.getSources()[0].id;
                creep.memory.source = source
            }
            const source = this.gameAccess.Game.getObjectById(creep.memory.source);
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#ffaa00',
                    },
                });
            }
        } else {

            // first container
            if (!creep.memory.target) {
                const sourceId = creep.memory.source;
                const range = 2; // You can adjust the range as needed

                const source = this.gameAccess.Game.getObjectById(sourceId);
                if (source) {
                    // Get the source's position
                    const sourcePos = source.pos;

                    // Find a container in the specified range
                    const nearbyContainer = sourcePos.findInRange(FIND_STRUCTURES, range, {
                        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER,
                    });

                    if (nearbyContainer.length > 0) {
                        creep.memory.target = nearbyContainer[0].id;
                    } else {
                        creep.memory.target = creep.room.find(FIND_MY_SPAWNS)[0].id;
                    }
                }
            }
            // If the creep's inventory is full, return to a spawn or storage to deposit resources

            const target = this.gameAccess.Game.getObjectById(creep.memory.target);
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff',
                        },
                    });
                }
            }
        }

    }
}

module.exports = BotFeatEven;