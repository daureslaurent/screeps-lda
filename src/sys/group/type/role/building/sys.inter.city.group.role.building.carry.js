const BotRole = require('core/enum/BotRole');
const utils = require('utils/utils');
const FlowType = require('core/flow/FlowType');

class SysInterCityGroupRoleBuildingCarry {

    constructor() {
        this.role = BotRole.CARRY
    }

    /**
     * @param creep {Creep}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param parent {GroupUnit}
     */
    runCreep(creep, gameAccess, roomData, parent) {
        if (creep.pos.roomName !== parent.currentPos.roomName) {
            // creep.moveToRoom(parent.currentPos.roomName)
            creep.moveTo(parent.currentPos)
            return;
        }

        if (parent.state === 'RECYCLE') {
            if (creep.store.getFreeCapacity() > 0) {
                this.findEnergy(creep, gameAccess, roomData, parent)
            } else {
                creep.moveTo(parent.currentPos);
            }
            return;
        }

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            this.findEnergy(creep, gameAccess, roomData, parent);
        } else {
            const leadCreepId = parent.creepsMap.get(BotRole.BUILDER);
            if (leadCreepId != null && leadCreepId.length > 0) {
                const creepLead = gameAccess.Game.getObjectById(leadCreepId[0]);
                if (creepLead.pos.roomName === parent.currentPos.roomName &&
                    creepLead.store.getUsedCapacity(RESOURCE_ENERGY) <= 10) {
                    creep.moveTo(creepLead);
                    return;
                }
            }
            creep.moveTo(parent.currentPos);
        }

    }

    findEnergy(creep, gameAccess, roomData, parent) {
        utils.talkAction(creep, '🔍')
        if (creep.memory.withdraw !== undefined && creep.memory.withdraw.room === creep.pos.roomName) {
            const storageUnit = roomData.getSysStorage()
                .getStorageFromIdStorage(creep.memory.withdraw.storageId)
            utils.talkAction(creep, storageUnit.getPos())
            if (creep.pos.isNearTo(storageUnit.getPos())) {
                storageUnit.finishActionId(creep.memory.withdraw.action)
                if (creep.pos.roomName === parent.roomHandle) {
                    roomData.getSysCity().getSysFlow()
                        .getFlowUnit(FlowType.INTERCITY)
                        .pushOutput(creep.memory.withdraw.amount)
                }
                creep.memory.withdraw = undefined
            } else {
                creep.moveTo(storageUnit.getPos())
            }
        } else {
            const storages = roomData.getSysStorage().getAllStorageByRoom(parent.currentPos.roomName)
                .filter(s => s.getFuture(RESOURCE_ENERGY) > 0)
            const closest = creep.pos.findClosestByPath(storages)
            if (closest != null) {
                creep.memory.locked = undefined
                const storageUnit = roomData.getSysStorage().getStorageFromIdStorage(closest.id)
                const amount = Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), storageUnit.getFuture(RESOURCE_ENERGY))
                const resultWithdraw = storageUnit.withdraw(
                    creep.id,
                    RESOURCE_ENERGY,
                    amount,
                )
                if (resultWithdraw != null) {
                    creep.memory.withdraw = {
                        storageId: storageUnit.id,
                        action: resultWithdraw,
                        room: creep.pos.roomName,
                        amount: amount,
                    };
                }

            } else {
                utils.talkAction(creep, '🛟')
                creep.memory.locked = true
                creep.moveTo(parent.currentPos)
            }
        }

    }

}

module.exports = SysInterCityGroupRoleBuildingCarry;