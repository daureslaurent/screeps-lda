const _moduleBot = require('core/interface/_moduleBot');
const utils = require('utils/utils')
const BotRole = require('core/enum/BotRole')

class BotFeatAtacker extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatAtacker', BotRole.ATACKER, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        const hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS) ||
            creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);

        if (hostile) {
            utils.talkAction(creep, `🦤`);
            if (creep.rangedAttack(hostile) === ERR_NOT_IN_RANGE) {
                creep.moveTo(hostile, {
                    visualizePathStyle: {
                        stroke: '#ff0000',
                    },
                });
            }
        } else {
            // creep.moveTo(Game.flags.B)
            utils.talkAction(creep, `🐝`);

            creep.moveTo(this.getRoomData().getSysCity().getWaitingPos())
        }


    }
}

module.exports = BotFeatAtacker;