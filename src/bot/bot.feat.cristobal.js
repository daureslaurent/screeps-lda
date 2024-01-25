const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole');
const Logs = require('utils/Logs');

class BotFeatCristobal extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatCristobal', BotRole.CRISTOBAL, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        if (creep == null) {
            Logs.logA('creep null -- JD08K', creepFast)
            return;
        }
        const username = this.roomDataFactory.getRoomData(creepFast.baseRoom).getUsername()
        // Check if the creep is in the target room
        if (creep.room.name !== creepFast.colon.target) {
            // Move to the target room
            creep.moveToRoom(creepFast.colon.target);
        } else {
            // In the target room
            if (!creep.pos.isNearTo(creep.room.controller)) {
                // Move closer to the controller
                creep.moveTo(creep.room.controller);
                creep.setStatic(false);
            } else {
                creep.setStatic();
                if (!creep.room.controller.reservation || creep.room.controller.reservation.username === username) {
                    creep.reserveController(creep.room.controller);
                }
                if (!creep.room.controller.reservation || creep.room.controller.reservation.username !== username) {
                    creep.attackController(creep.room.controller);
                } else {
                    // Already reserved, so renew the reservation
                    creep.reserveController(creep.room.controller);
                }
            }
        }

    }
}

module.exports = BotFeatCristobal;