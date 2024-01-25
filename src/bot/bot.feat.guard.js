const _moduleBot = require('core/interface/_moduleBot');
const utils = require('utils/utils');
const BotRole = require('core/enum/BotRole');

class BotFeatGuard extends _moduleBot {
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatGuard', BotRole.GUARD, gameAccess, roomDataFactory);
    }

    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);

        if (!creep) return;

        const {
            memory,
        } = creep;
        const targetRoom = memory.colon.target;

        if (creep.room.name !== targetRoom) {
            utils.talkAction(creep, `😡 -> ${targetRoom}`);
            creep.moveToRoom(targetRoom);
            return;
        }

        let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            // filter: enemy => enemy.getActiveBodyparts(HEAL) > 0
        });

        let hostileTarget = hostile || creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);

        const flag = Game.flags.ATT;

        if (flag && flag.room && flag.room.name === creep.room.name) {
            const obj = creep.room.lookForAt(LOOK_STRUCTURES, flag.pos)[0];
            if (obj) hostileTarget = obj;
        }

        if (!hostile && hostileTarget) {
            this.attackTarget(creep, hostileTarget);
        } else if (hostile) {
            this.attackTarget(creep, hostile);
        } else {
            creep.moveTo(new RoomPosition(25, 25, targetRoom));
            utils.talkAction(creep, `🐝`);
        }
    }

    attackTarget(creep, target) {
        utils.talkAction(creep, `🦤`);
        if (creep.attack(target) !== OK) {
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ff0000',
                },
            });
            creep.rangedAttack(target);
        }
    }
}

module.exports = BotFeatGuard;