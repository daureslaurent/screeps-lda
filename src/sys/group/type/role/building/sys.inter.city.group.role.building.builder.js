const BotRole = require('core/enum/BotRole');
const utils = require('utils/utils');

class SysInterCityGroupRoleBuildingBuilder {

    constructor() {
        this.role = BotRole.BUILDER
    }

    /**
     * @param creep {Creep}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param parent {SysInterCityGroupModuleBuilding}
     */
    runCreep(creep, gameAccess, roomData, parent) {
        // if (creep.pos.roomName !== parent.currentPos.roomName) {
        //     creep.moveToRoom(parent.currentPos.roomName)
        //     return;
        // }

        utils.talkAction(creep, 'H')
        creep.moveTo(parent.currentPos)
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) <= 10 && parent.creepsMap.has(BotRole.CARRY)) {
            /** @type {Creep[]} */
            const carrys = parent.creepsMap.get(BotRole.CARRY)
                .map(c => gameAccess.Game.getObjectById(c))
                .filter(c => c != null)
            const carryNear = carrys
                .filter(c => c.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
                .filter(c => c.pos.isNearTo(creep.pos))

            if (carryNear.length > 0) {
                carryNear[0].transfer(creep, RESOURCE_ENERGY);
            }
            utils.talkAction(creep, 'need energy !')
        }
        if (creep.pos.inRangeTo(parent.currentPos, 2)) {
            const work = parent.getCurrentWork(gameAccess)
            const ret = this.doAction(creep, work)
            if (ret === OK) {
                const objRepared = gameAccess.Game.getObjectByIdNonCached(work.tgt.id);
                if (objRepared == null || (objRepared.hits === objRepared.hitsMax && 'REPAIR' === work.type)) {
                    parent.finishWork(work.tgt.id, work.type)
                }
            }
        }

    }

    doAction(creep, work) {
        if (work != null) {
            if ('REPAIR' === work.type) {
                return creep.repair(work.tgt)
            } else if ('CONSTRUCT' === work.type) {
                return creep.build(work.tgt)
            }
        }
    }

}

module.exports = SysInterCityGroupRoleBuildingBuilder;