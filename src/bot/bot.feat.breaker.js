const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole');

class BotFeatBreaker extends _moduleBot {
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatBreaker', BotRole.BREAKER, gameAccess, roomDataFactory);
    }

    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        if (!creep) return;

        const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (target && this.canRangedAttack(creep, target)) return;
        if (target && this.canAttack(creep, target)) return;


        const flag = Game.shard.name === 'shard3' ? Game.flags.EDEN : Game.flags.BREAKER;
        if (!flag || creep.room.name !== flag.pos.roomName) {
            this.moveToFlag(creep, flag);
            return;
        }

        this.handleAutoHeal(creep);

        if (Game.shard.name === 'shard3') {
            const nearestPortal = this.findNearestPortal(creep.room);
            this.travelToOtherShard(creep, nearestPortal);
            return;
        }

        const hostileSec = this.checkHostileSec(creep);
        if (hostileSec && this.attackHostileSec(creep, hostileSec)) return;
        // Add attack action here if a target is found
        if (hostileSec) {
            if (creep.attack(hostileSec) === OK) {
                return;
            } else {
                creep.moveTo(hostileSec, {
                    visualizePathStyle: {
                        stroke: '#ff0000',
                    },
                });
                return;
            }
        }
        creep.moveTo(flag);
    }

    moveToFlag(creep, flag) {
        creep.moveTo(flag);
        // utils.talkAction(creep, `Moving to flag ${flag.name}`);
    }

    handleAutoHeal(creep) {
        const woundedAlly = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: ally => ally.hits < ally.hitsMax,
        });

        if (woundedAlly && creep.pos.isNearTo(woundedAlly)) {
            creep.heal(woundedAlly);
        }
    }

    canRangedAttack(creep, target) {
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0 && creep.rangedAttack(target) !== OK) {
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ff0000',
                },
            });
            return true;
        }
        return false;
    }

    canAttack(creep, target) {
        if (creep.getActiveBodyparts(ATTACK) > 0 && creep.attack(target) !== OK) {
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ff0000',
                },
            });
            return true;
        }
        return false;
    }

    findNearestPortal(room) {
        const portals = room.find(FIND_STRUCTURES, {
            filter: {
                structureType: STRUCTURE_PORTAL,
            },
        });
        return portals.length > 0 ? portals[0] : null;
    }

    travelToOtherShard(creep, portal) {
        if (!portal) {
            console.log('No portal found in this room!');
            return;
        }
        creep.moveTo(portal);
    }

    checkHostileSec(creep) {
        const flagAtt = Game.flags.ATT;
        return flagAtt && flagAtt.room.name === creep.room.name ? creep.room.lookForAt(LOOK_STRUCTURES, flagAtt)[0] : undefined;
    }

    attackHostileSec(creep, hostileSec) {
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0 && creep.attack(hostileSec) !== OK) {
            creep.moveTo(hostileSec, {
                visualizePathStyle: {
                    stroke: '#ff0000',
                },
            });
            creep.rangedAttack(hostileSec);
            return true;
        }
        return false;
    }
}

module.exports = BotFeatBreaker;